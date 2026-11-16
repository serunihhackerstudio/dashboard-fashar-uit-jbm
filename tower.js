/* =========================================================
   TOWER EMERGENCY (Peralatan ERS) — inventaris TE per lokasi & per NAMA KONTAINER
   Data: data/tower-emergency.js (tools/sheet_tower_to_js.py) dari spreadsheet DATA TOWER EMERGENCY,
   sheet LINDSEY BANGIL, TS BABAT, LINDSEY PACITAN, TS TANDES, TS TANAH LOT, SBB KEBONAGUNG.
   ========================================================= */
(function () {
  const sec = $("#page-tower");
  const DOC = window.TOWER_TE;
  if (!sec || !DOC) return;
  const SHEET_URL = `https://docs.google.com/spreadsheets/d/${DOC.sheetId}/edit`;
  const svg = p => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
  const MERK_C = { Lindsey: "#1667D9", TS: "#F59E0B", SBB: "#10B981" };
  const KON_C = ["#1667D9", "#F59E0B", "#10B981", "#8B5CF6", "#EF4444", "#0EA5A4"];
  const num = n => (Math.round((n || 0) * 100) / 100).toLocaleString("id-ID");
  const title1 = s => String(s || "").toLowerCase().replace(/(^|[\s/(&-])([a-z])/g, (m, a, b) => a + b.toUpperCase()).replace(/\bErs\b/g, "ERS").replace(/\bE\.r\.s\./g, "E.R.S.").replace(/\bHpu\b/g, "HPU").replace(/\bOhgw\b/g, "OHGW").replace(/\b(Upt|Ultg|Gis|Gi|Te|Ts|Sbb|Kv)\b/g, m => m.toUpperCase()).replace(/ (And|Of|For|With|Or|The) /g, m => m.toLowerCase());
  const isBad = it => /rusak|tidak lengkap|tidak ada|kurang|karat|hilang|tanpa|tidak memiliki|patah|bengkok/i.test(it.ket || "");

  // normalisasi data
  const LOK = DOC.lokasi.map((L, li) => ({
    ...L, li, key: L.sheet, color: MERK_C[L.merk] || KON_C[li % KON_C.length],
    items: L.items.map((it, ii) => ({ ...it, li, ii, lok: L.lokasi, kat: title1(it.kat), total: Number(it.total) || 0 }))
  }));
  const ALL = LOK.flatMap(L => L.items);
  const S = { lok: "", kon: "", kat: "", q: "", only: "", view: (() => { try { return localStorage.getItem("fashar-te-view") || "grid"; } catch (e) { return "grid"; } })(), page: 1 };
  const PER = 24;
  const curLok = () => LOK.find(L => L.key === S.lok) || null;

  /* ---------- Kerangka halaman ---------- */
  sec.innerHTML = `
   <div class="tdb-bar card ab-bar">
    <div class="tdb-bar-info"><span class="chip sync live"><i class="live-dot"></i>Spreadsheet Tower Emergency</span><span class="muted sm">Data per ${esc(typeof fmtTanggal === "function" ? fmtTanggal(DOC.generated) : DOC.generated)} · ${LOK.length} sheet lokasi · acuan kolom <b>NAMA KONTAINER</b></span></div>
    <div class="tdb-actions"><a class="btn primary" href="${SHEET_URL}" target="_blank" rel="noopener">${svg('<path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>')}Buka spreadsheet</a></div>
   </div>
   <div class="ab-kpis te-kpis" id="teKpi"></div>

   <div class="te-top">
    <div class="card te-map-card">
     <div class="card-head"><div><h3>Peta lokasi tower emergency</h3><p>Ukuran titik = jumlah kontainer · klik titik untuk memilih lokasi</p></div></div>
     <div class="tdb-mapwrap te-mapwrap"><div id="teMap" class="alx-map" role="region" aria-label="Peta lokasi tower emergency"></div>
      <p class="muted sm te-map-fb" id="teMapFb" hidden>Peta tidak dapat dimuat.</p></div>
    </div>
    <div class="card te-merk-card">
     <div class="card-head"><div><h3>Komposisi per merek</h3><p>Lokasi, kontainer &amp; jenis item</p></div></div>
     <div class="card-body" id="teMerk"></div>
    </div>
   </div>

   <div class="te-sec-h"><h3>Lokasi &amp; kontainer</h3><p class="muted">Setiap lokasi berisi satu atau beberapa kontainer (sesuai kolom <b>NAMA KONTAINER</b> di sheet). Klik kartu lokasi untuk melihat isinya.</p></div>
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
   <footer class="modal-foot"><div class="modal-btns"><button class="btn primary" type="button" onclick="this.closest('dialog').close()">Tutup</button></div></footer></div></dialog>`);

  /* ---------- KPI & ringkasan ---------- */
  function renderKpi() {
    const kon = LOK.reduce((a, L) => a + L.containers.length, 0), ket = ALL.filter(it => it.ket).length, bad = ALL.filter(isBad).length, nol = ALL.filter(it => !it.total).length;
    const merk = [...new Set(LOK.map(L => L.merk))];
    $("#teKpi").innerHTML = [
      ["Lokasi tower emergency", LOK.length, "tower", "primary", `${merk.length} merek: ${merk.join(", ")}`, ""],
      ["Kontainer", kon, "box", "p3", "Sesuai kolom NAMA KONTAINER", ""],
      ["Jenis item", fmt(ALL.length), "doc", "primary", `${new Set(ALL.map(i => i.kat)).size} kategori komponen`, ""],
      ["Item dengan catatan", ket, "alert", "p2", `${bad} indikasi rusak / tidak lengkap`, "ket"],
      ["Item berjumlah 0", nol, "pulse", "p1", "Kosong / dipinjam / belum ada", "nol"]
    ].map(([l, v, ic, t, sub, only]) => `<div class="card kpi tone-${t}${only ? " te-kpi-click" : ""}"${only ? ` data-only="${only}" role="button" tabindex="0" title="Klik untuk menampilkan item"` : ""}><div class="kpi-icon">${ic === "box" ? `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">` + ('<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z"/><path d="m3 7.5 9 4.5 9-4.5M12 12v9"/>') + "</svg>" : icon(ic)}</div><div><div class="kpi-label">${l}</div><div class="kpi-value">${v}</div><div class="kpi-sub">${esc(sub)}</div></div></div>`).join("");

    const byM = merk.map(m => { const Ls = LOK.filter(L => L.merk === m); return { m, n: Ls.length, kon: Ls.reduce((a, L) => a + L.containers.length, 0), it: Ls.reduce((a, L) => a + L.items.length, 0), lok: Ls.map(L => L.lokasi) }; });
    const mx = Math.max(...byM.map(x => x.kon));
    $("#teMerk").innerHTML = `<ul class="te-merk">${byM.map(x => `<li style="--c:${MERK_C[x.m]}">
      <div class="te-merk-top"><span class="te-merk-badge">${esc(x.m)}</span><b>${x.kon} kontainer</b><small>${x.n} lokasi · ${fmt(x.it)} jenis item</small></div>
      <span class="te-merk-bar"><i style="width:${x.kon / mx * 100}%"></i></span>
      <small class="te-merk-lok">${x.lok.map(esc).join(" · ")}</small></li>`).join("")}</ul>
      <p class="te-merk-note">${svg('<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>')}Nama kontainer memakai nama gunung (mis. Bromo, Semeru, Kerinci) sesuai penamaan di spreadsheet.</p>`;
  }

  /* ---------- Kartu lokasi ---------- */
  function renderLoks() {
    $("#teLoks").innerHTML = [`<button type="button" class="card te-lok te-lok-all${!S.lok ? " on" : ""}" data-lok="">
        <span class="te-lok-ic">${svg('<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z"/><path d="m3 7.5 9 4.5 9-4.5M12 12v9"/>')}</span>
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
      $("#teDetHead").innerHTML = `<div><span class="eyebrow">Ringkasan</span><h3>Semua lokasi tower emergency</h3><p class="muted">Pilih kartu lokasi di atas untuk melihat isi tiap kontainer.</p></div>`;
      $("#teKons").innerHTML = `<div class="te-kon-grid">${LOK.map(x => `<button type="button" class="te-kon te-kon-lok" data-lok="${esc(x.key)}" style="--c:${x.color}">${conArt(x.color)}<b>${esc(x.lokasi)}</b><small>${x.containers.map(esc).join(", ")}</small><em>${fmt(x.items.length)} item</em></button>`).join("")}</div>`;
    } else {
      $("#teDetHead").innerHTML = `<div><span class="eyebrow" style="color:${L.color}">${esc(L.merk)} · sheet ${esc(L.sheet)}</span><h3>${esc(L.lokasi)}</h3><p class="muted">${esc(title1(L.title))} · ${L.containers.length} kontainer · ${fmt(L.items.length)} jenis item</p></div>
        <button type="button" class="btn ghost" data-lok="">${svg('<path d="M15 6l-6 6 6 6"/>')}Semua lokasi</button>`;
      const per = L.containers.map((k, i) => ({ k, i, n: L.items.filter(it => it.q[k]).length, v: L.items.reduce((a, it) => a + (it.q[k] || 0), 0) }));
      $("#teKons").innerHTML = `<div class="te-kon-grid">${per.map(x => `<button type="button" class="te-kon${S.kon === x.k ? " on" : ""}" data-kon="${esc(x.k)}" style="--c:${KON_C[x.i % KON_C.length]}" aria-pressed="${S.kon === x.k}">
          ${conArt(KON_C[x.i % KON_C.length])}<span class="te-kon-lbl">Kontainer</span><b>${esc(x.k)}</b><em>${x.n} jenis item</em><small>${num(x.v)} total volume</small></button>`).join("")}</div>
        ${L.notes && L.notes.length ? `<div class="te-notes"><b>${svg('<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>')}Catatan pada sheet</b><ul>${L.notes.map(n => `<li>${esc(n.replace(/\n/g, " · "))}</li>`).join("")}</ul></div>` : ""}`;
    }
    // grafik: jumlah jenis item per kategori & per kontainer/lokasi
    const kats = new Map(); items.forEach(it => kats.set(it.kat, (kats.get(it.kat) || 0) + 1));
    const K = [...kats.entries()].sort((a, b) => b[1] - a[1]), mk = Math.max(1, ...K.map(x => x[1]));
    const side = L ? L.containers.map((k, i) => [k, L.items.filter(it => it.q[k]).length, KON_C[i % KON_C.length]]) : LOK.map(x => [x.lokasi, x.items.length, x.color]);
    const ms = Math.max(1, ...side.map(x => x[1]));
    const cond = [["Lengkap / sesuai", items.filter(it => it.total && !it.ket).length, "var(--ok)"], ["Ada catatan", items.filter(it => it.ket && !isBad(it)).length, "var(--p3)"], ["Indikasi rusak / tidak lengkap", items.filter(isBad).length, "var(--p2)"], ["Jumlah 0", items.filter(it => !it.total && !it.ket).length, "var(--p1)"]];
    const ct = cond.reduce((a, x) => a + x[1], 0) || 1;
    let acc = 0;
    $("#teCharts").innerHTML = `
      <div class="te-chart"><h4>Jenis item per kategori</h4><ul class="bars ab-bars">${K.map(([k, v]) => `<li title="${esc(k)}" data-kat="${esc(k)}" class="te-click"><span class="bl">${esc(k)}</span><span class="bt"><i style="width:${v / mk * 100}%;background:var(--primary)"></i></span><b>${v}</b></li>`).join("")}</ul></div>
      <div class="te-chart"><h4>${L ? "Jenis item per kontainer" : "Jenis item per lokasi"}</h4><ul class="bars ab-bars">${side.map(([k, v, c]) => `<li title="${esc(k)}" ${L ? `data-kon="${esc(k)}"` : `data-lok="${esc((LOK.find(x => x.lokasi === k) || {}).key || "")}"`} class="te-click"><span class="bl">${esc(k)}</span><span class="bt"><i style="width:${v / ms * 100}%;background:${c}"></i></span><b>${v}</b></li>`).join("")}</ul></div>
      <div class="te-chart"><h4>Kondisi data item</h4>
       <div class="te-donut-wrap"><svg viewBox="0 0 42 42" class="te-donut" aria-hidden="true"><circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--surface-2)" stroke-width="6"/>${cond.map(([, v, c]) => { const d = v / ct * 100, s = `<circle cx="21" cy="21" r="15.9" fill="none" stroke="${c}" stroke-width="6" stroke-dasharray="${d} ${100 - d}" stroke-dashoffset="${25 - acc}"/>`; acc += d; return s; }).join("")}<text x="21" y="22.5" text-anchor="middle">${fmt(items.length)}</text></svg>
        <ul class="te-legend">${cond.map(([l, v, c]) => `<li><i style="background:${c}"></i>${l}<b>${v}</b></li>`).join("")}</ul></div>
       <p class="muted sm">Berdasarkan isi kolom KETERANGAN dan jumlah pada sheet.</p></div>`;
  }
  const conArt = c => `<svg class="te-con-art" viewBox="0 0 64 40" aria-hidden="true"><rect x="2" y="6" width="60" height="30" rx="3" fill="${c}"/><path d="M10 10v22M18 10v22M26 10v22M34 10v22M42 10v22M50 10v22" stroke="rgba(255,255,255,.35)" stroke-width="2.4"/><rect x="2" y="6" width="60" height="5" rx="2" fill="rgba(0,0,0,.18)"/><circle cx="56" cy="21" r="1.8" fill="rgba(255,255,255,.8)"/></svg>`;

  /* ---------- Daftar item ---------- */
  function filtered(ignoreKat) {
    const q = S.q.trim().toLowerCase();
    return scope().filter(it => (!S.kon || it.q[S.kon]) && (ignoreKat || !S.kat || it.kat === S.kat) &&
      (!S.only || (S.only === "ket" ? it.ket : !it.total)) &&
      (!q || [it.nama, it.part, it.ts, it.ket, it.kat, it.lok, Object.values(it.extra || {}).join(" ")].join(" ").toLowerCase().includes(q)));
  }
  const qtyPills = it => { const L = LOK[it.li]; return L.containers.map((k, i) => it.q[k] ? `<span class="te-q" style="--c:${KON_C[i % KON_C.length]}" title="Kontainer ${esc(k)}">${esc(k)} <b>${num(it.q[k])}</b></span>` : "").join(""); };
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
    const P = L.slice((S.page - 1) * PER, S.page * PER), multi = !curLok();
    const lokL = curLok();
    $("#teShown").innerHTML = `Menampilkan <b>${L.length}</b> jenis item${lokL ? ` di <b>${esc(lokL.lokasi)}</b>` : " dari semua lokasi"}${S.kon ? ` · kontainer <b>${esc(S.kon)}</b> <button type="button" class="linkbtn" data-kon="${esc(S.kon)}">hapus</button>` : ""}`;
    if (!L.length) { $("#teItems").innerHTML = `<div class="card empty te-empty">Tidak ada item yang cocok dengan filter.</div>`; $("#tePager").innerHTML = ""; return; }
    if (S.view === "grid") {
      $("#teItems").innerHTML = `<div class="te-grid">${P.map(it => `<button type="button" class="card te-item${isBad(it) ? " bad" : ""}" data-it="${it.li}:${it.ii}">
        <span class="te-ph">${photo(it, "te-img")}${it.ket ? `<span class="te-flag" title="${esc(it.ket)}">${svg('<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>')}Catatan</span>` : ""}</span>
        <span class="te-body"><small class="te-kat">${multi ? `${esc(it.lok)} · ` : ""}${esc(it.kat)}</small><b class="te-nm">${esc(it.nama)}</b>${it.part || it.ts ? `<small class="te-part">${esc(it.part || it.ts)}</small>` : ""}
        <span class="te-qs">${qtyPills(it)}</span>
        <span class="te-tot"><b class="${it.total ? "" : "zero"}">${num(it.total)}</b> ${esc(it.satuan || "")}<small>total</small></span></span></button>`).join("")}</div>`;
    } else {
      const cons = lokL ? lokL.containers : [];
      $("#teItems").innerHTML = `<div class="card"><div class="table-wrap ab-table te-table"><table class="table"><thead><tr><th></th><th>Item</th>${multi ? "<th>Lokasi</th>" : ""}<th>Kategori</th>${cons.map((k, i) => `<th class="num"><span class="te-th-dot" style="--c:${KON_C[i % KON_C.length]}"></span>${esc(k)}</th>`).join("")}${multi ? "<th>Per kontainer</th>" : ""}<th class="num">Total</th><th>Satuan</th><th>Keterangan</th></tr></thead><tbody>
        ${P.map(it => `<tr data-it="${it.li}:${it.ii}" tabindex="0"${isBad(it) ? ' class="te-bad"' : ""}><td class="te-tdimg">${photo(it, "te-thumb")}</td><td><b>${esc(it.nama)}</b>${it.part || it.ts ? `<div class="muted sm">${esc(it.part || it.ts)}</div>` : ""}</td>${multi ? `<td class="sm">${esc(it.lok)}</td>` : ""}<td class="sm">${esc(it.kat)}</td>
        ${cons.map(k => `<td class="num">${it.q[k] ? num(it.q[k]) : `<span class="muted">—</span>`}</td>`).join("")}${multi ? `<td><span class="te-qs">${qtyPills(it)}</span></td>` : ""}<td class="num"><b class="${it.total ? "" : "te-zero"}">${num(it.total)}</b></td><td class="sm">${esc(it.satuan || "—")}</td><td class="sm te-ket">${esc(it.ket || "")}</td></tr>`).join("")}
        </tbody></table></div></div>`;
    }
    $("#tePager").innerHTML = pages > 1 ? `<button type="button" class="btn ghost" data-page="${S.page - 1}" ${S.page <= 1 ? "disabled" : ""}>‹ Sebelumnya</button><span class="muted">Halaman <b>${S.page}</b> dari ${pages}</span><button type="button" class="btn ghost" data-page="${S.page + 1}" ${S.page >= pages ? "disabled" : ""}>Berikutnya ›</button>` : "";
  }

  /* ---------- Pop-up detail item ---------- */
  function openItem(li, ii) {
    const L = LOK[li], it = L && L.items[ii]; if (!it) return;
    $("#teDlgTitle").textContent = it.nama;
    $("#teDlgSub").innerHTML = `<span class="te-merk-badge" style="--c:${L.color}">${esc(L.merk)}</span> ${esc(L.lokasi)} · ${esc(it.kat)}`;
    const mx = Math.max(1, ...L.containers.map(k => it.q[k] || 0));
    const dd = (l, v) => `<div><dt>${l}</dt><dd class="${v ? "pre" : "nil"}">${v || "—"}</dd></div>`;
    $("#teDlgBody").innerHTML = `<div class="te-dlg">
      <div class="te-dlg-ph">${it.img ? `<a href="${esc(it.img)}" class="te-zoom" title="Klik untuk memperbesar"><img src="${esc(it.img)}" alt="${esc(it.nama)}"></a><small class="muted">Klik foto untuk memperbesar</small>` : photo(it, "te-img big")}</div>
      <div><dl class="dgrid">${dd(L.merk === "TS" ? "Uraian / nama barang" : "Description", esc(it.nama))}${dd(L.merk === "TS" ? "Nama TS" : "Part no.", esc(it.part || it.ts))}${dd("Satuan", esc(it.satuan))}${dd("Total", `<b>${num(it.total)}</b> ${esc(it.satuan || "")}`)}
        ${Object.entries(it.extra || {}).map(([k, v]) => dd(esc(title1(k)), esc(v))).join("")}</dl>
        <h4 class="te-dlg-h">Jumlah per kontainer</h4>
        <ul class="bars ab-bars">${L.containers.map((k, i) => `<li><span class="bl">${esc(k)}</span><span class="bt"><i style="width:${(it.q[k] || 0) / mx * 100}%;background:${KON_C[i % KON_C.length]}"></i></span><b>${num(it.q[k] || 0)}</b></li>`).join("")}</ul>
        ${it.ket ? `<div class="te-ket-box${isBad(it) ? " bad" : ""}"><b>Keterangan</b><p>${esc(it.ket)}</p></div>` : ""}
        <p class="muted sm">Sumber: sheet <b>${esc(L.sheet)}</b> · spreadsheet Tower Emergency</p></div></div>`;
    $("#teDialog").showModal();
  }

  /* ---------- Peta ---------- */
  const MAP = { map: null, layer: null, fitted: false };
  function renderMap() {
    if (!window.L || !$("#teMap")) { $("#teMapFb").hidden = false; return; }
    if (!MAP.map) {
      MAP.map = L.map("teMap", { scrollWheelZoom: false, minZoom: 5 }).setView([-7.8, 113.2], 7);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, className: typeof tdbIsDark === "function" && tdbIsDark() ? "tiles-dark" : "",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' }).addTo(MAP.map);
      MAP.layer = L.layerGroup().addTo(MAP.map);
    }
    MAP.layer.clearLayers();
    LOK.forEach(x => {
      if (x.lat == null) return;
      const sz = 30 + x.containers.length * 4;
      L.marker([x.lat, x.lng], { title: `${x.lokasi} · ${x.containers.length} kontainer`, riseOnHover: true,
        icon: L.divIcon({ className: "tm-icon", iconSize: [sz, sz], iconAnchor: [sz / 2, sz / 2], html: `<span class="tm-pin te-pin${S.lok === x.key ? " sel" : ""}" style="--c:${x.color};width:${sz}px;height:${sz}px">${x.containers.length}</span>` }) })
        .on("click", () => select(S.lok === x.key ? "" : x.key, true))
        .bindTooltip(`<b>${esc(x.lokasi)}</b> · ${esc(x.merk)}<br>${x.containers.map(esc).join(", ")}<br>${fmt(x.items.length)} jenis item`, { direction: "top", offset: [0, -sz / 2] })
        .addTo(MAP.layer);
    });
  }
  function mapFit() {
    if (!MAP.map) return; MAP.map.invalidateSize();
    const L0 = curLok();
    if (L0) MAP.map.setView([L0.lat, L0.lng], 9, { animate: true });
    else MAP.map.fitBounds(LOK.filter(x => x.lat != null).map(x => [x.lat, x.lng]), { padding: [40, 40] });
  }

  /* ---------- Interaksi ---------- */
  function select(key, scroll) {
    S.lok = key; S.kon = ""; S.kat = ""; S.page = 1;
    renderLoks(); renderDetail(); renderItems(); renderMap(); mapFit();
    if (scroll) $("#teDetail").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function render() { renderKpi(); renderLoks(); renderDetail(); renderItems(); renderMap(); }

  sec.addEventListener("click", e => {
    const t = e.target;
    const lok = t.closest("[data-lok]"); if (lok) return select(lok.dataset.lok, !!lok.closest(".te-loks, .te-kon-grid, .te-chart"));
    const kon = t.closest("[data-kon]"); if (kon) { S.kon = S.kon === kon.dataset.kon ? "" : kon.dataset.kon; S.page = 1; renderDetail(); return renderItems(); }
    const kat = t.closest("[data-kat]"); if (kat) { S.kat = kat.closest(".te-chart") && S.kat === kat.dataset.kat ? "" : kat.dataset.kat; S.page = 1; renderItems(); if (kat.closest(".te-chart")) $("#teKat").scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    const on = t.closest("[data-only]"); if (on) { S.only = S.only === on.dataset.only ? "" : on.dataset.only; S.page = 1; renderItems(); if (on.classList.contains("kpi")) $("#teKat").scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    const v = t.closest("[data-view]"); if (v) { S.view = v.dataset.view; try { localStorage.setItem("fashar-te-view", S.view); } catch (er) { } return renderItems(); }
    const pg = t.closest("[data-page]"); if (pg && !pg.disabled) { S.page = +pg.dataset.page; renderItems(); return $("#teShown").scrollIntoView({ behavior: "smooth", block: "start" }); }
    const it = t.closest("[data-it]"); if (it) { const [a, b] = it.dataset.it.split(":").map(Number); openItem(a, b); }
  });
  sec.addEventListener("keydown", e => {
    if (e.key !== "Enter") return;
    const it = e.target.closest("tr[data-it]"); if (it) { const [a, b] = it.dataset.it.split(":").map(Number); openItem(a, b); }
    const k = e.target.closest(".kpi[data-only]"); if (k) k.click();
  });
  $("#teSearch").addEventListener("input", e => { S.q = e.target.value; S.page = 1; renderItems(); });
  $("#teDialog").addEventListener("click", e => {
    if (e.target === $("#teDialog")) return $("#teDialog").close();
    const z = e.target.closest(".te-zoom"); if (z && window.openLightbox) { e.preventDefault(); openLightbox([{ thumb: z.getAttribute("href"), alt: $("#teDlgTitle").textContent, view: z.getAttribute("href") }], 0); }
  });

  window.PAGE_UPDATED = window.PAGE_UPDATED || {};
  window.PAGE_UPDATED.tower = () => ({ date: DOC.generated, title: "Tanggal pengambilan data dari spreadsheet Tower Emergency" });
  window.TOWER_SUMMARY = () => ({ lokasi: LOK.length, kontainer: LOK.reduce((a, L) => a + L.containers.length, 0), item: ALL.length });
  addEventListener("hashchange", () => { if (location.hash === "#tower") setTimeout(() => { if (!MAP.fitted) { mapFit(); MAP.fitted = true; } else MAP.map && MAP.map.invalidateSize(); }, 80); });

  render();
  if (location.hash === "#tower") setTimeout(() => { mapFit(); MAP.fitted = true; if (typeof setUpdated === "function") setUpdated("tower"); }, 80);
})();
