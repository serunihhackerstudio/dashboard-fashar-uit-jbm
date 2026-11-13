/* =========================================================
   MENU AO (section RKAU) — Monitoring program kerja AO
   Data live: spreadsheet RKAU, sheet "MONITORING AO" (Google Visualization API, read-only).
   Cadangan: data/ao.js (tools/sheet_ao_to_js.py).
   ========================================================= */
(function () {
  const sec = $("#page-ao");
  if (!sec) return;
  const DOC = window.AO_DATA || { rows: [] };
  const SHEET_ID = DOC.sheetId || "1RpPBoPXkaPu98nO41LXEuttQi8YkP3AO6xSPRmg-0M0", SHEET = DOC.sheet || "MONITORING AO";
  const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;
  // nama tahap 3–6 sesuai isi sheet; tahap 1–2 belum muncul di data, nama diambil dari sheet bila nanti ada
  const STAGE_DEF = { 1: "Tahap 1", 2: "Tahap 2", 3: "Proses Kontrak Laksda", 4: "Pelaksanaan Pekerjaan", 5: "Proses IPMS & VIP", 6: "Terbayar" };
  const STAGE_C = { 1: "var(--text-3)", 2: "var(--violet)", 3: "var(--p2)", 4: "var(--primary)", 5: "#0ea5a4", 6: "var(--ok)" };
  const S = { rows: norm(DOC.rows), q: "", st: "", proker: "", live: false, loadedAt: null, sort: { k: "no", dir: 1 } };
  const svg = p => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;

  function learnStages(rows) { rows.forEach(r => { if (r.stage && r.stageName) STAGE_DEF[r.stage] = r.stageName; }); return rows; }
  function norm(rows) { return learnStages(norm0(rows)); }
  function norm0(rows) {
    return (rows || []).map((r, i) => {
      const m = String(r.status || "").match(/^\s*(\d+)\s*\.?\s*(.*)$/);
      const stage = m ? +m[1] : 0;
      const prog = r.progres == null || r.progres === "" ? (stage ? stage / 6 : 0) : Number(r.progres);
      return { ...r, _i: i, no: r.no != null ? Math.round(r.no) : i + 1, rab: Number(r.rab) || 0, kontrak: Number(r.kontrak) || 0,
        stage, stageName: (m && m[2]) || r.status || "Belum diisi", progres: prog > 1.5 ? prog / 100 : prog };
    });
  }
  const rp = n => "Rp " + Math.round(n || 0).toLocaleString("id-ID");
  const rpShort = n => { n = n || 0; return n >= 1e9 ? "Rp " + (n / 1e9).toFixed(2).replace(".", ",") + " M" : n >= 1e6 ? "Rp " + (n / 1e6).toFixed(1).replace(".", ",") + " jt" : rp(n); };
  const pct = x => Math.round((x || 0) * 100) + "%";
  const stageName = s => STAGE_DEF[s] || "Belum diisi";
  const chip = r => `<span class="badge ao-st" style="--c:${STAGE_C[r.stage] || "var(--text-3)"}">${r.stage ? r.stage + ". " : ""}${esc(r.stageName)}</span>`;
  const bar = p => `<span class="ao-prog"><i style="width:${Math.min(100, p * 100)}%;background:${p >= 1 ? "var(--ok)" : p >= .67 ? "var(--primary)" : "var(--p2)"}"></i></span>`;

  sec.innerHTML = `
   <div class="tdb-bar card ab-bar">
    <div class="tdb-bar-info"><span class="chip sync" id="aoSync"></span><span class="muted sm" id="aoSyncNote"></span></div>
    <div class="tdb-actions"><button class="btn ghost" type="button" id="aoReload">${svg('<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8M21 3v5h-5"/>')}Muat ulang</button>
     <a class="btn primary" href="${SHEET_URL}" target="_blank" rel="noopener">${svg('<path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>')}Buka spreadsheet</a></div>
   </div>
   <div class="ab-kpis" id="aoKpi"></div>
   <div class="card ao-pipe-card"><div class="card-head"><div><h3>Tahapan program kerja</h3><p>Jumlah program & nilai per tahapan · klik untuk memfilter</p></div></div><div class="card-body" id="aoPipe"></div></div>
   <div class="grid g2 ab-charts">
    <div class="card"><div class="card-head"><div><h3>Serapan anggaran</h3><p>Total RAB, nilai kontrak, dan nilai yang sudah terbayar</p></div></div><div class="card-body" id="aoFunds"></div></div>
    <div class="card"><div class="card-head"><div><h3>Nilai per proker RKAU</h3><p>Nilai kontrak (atau RAB bila belum kontrak) per proker · klik untuk memfilter</p></div></div><div class="card-body" id="aoProker"></div></div>
   </div>
   <div class="ab-filters ao-filters">
    <div class="ab-chips" id="aoSt" role="group" aria-label="Filter tahapan"></div>
    <div class="ab-filter-right"><div class="search"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="aoSearch" type="search" placeholder="Cari program kerja, proker, no. kontrak…" aria-label="Cari program kerja"></div></div>
   </div>
   <p class="muted ab-shown" id="aoShown"></p>
   <div class="card">
    <div class="table-wrap ab-table ao-table"><table class="table"><thead id="aoHead"></thead><tbody id="aoRows"></tbody></table><div class="empty" id="aoEmpty" hidden>Tidak ada program kerja yang cocok.</div></div>
    <div class="card-foot tdb-foot"><span class="muted" id="aoCount"></span><span class="muted sm" id="aoFoot"></span></div>
   </div>`;
  document.body.insertAdjacentHTML("beforeend", `<dialog class="modal" id="aoDetail" aria-labelledby="aoDetTitle"><div class="modal-wrap">
   <header class="modal-head"><div><h3 id="aoDetTitle"></h3><p id="aoDetSub"></p></div><button class="icon-btn" type="button" onclick="this.closest('dialog').close()" aria-label="Tutup">${svg('<path d="M6 6l12 12M18 6 6 18"/>')}</button></header>
   <div class="modal-body" id="aoDetBody"></div>
   <footer class="modal-foot"><div class="modal-btns"><a class="btn ghost" href="${SHEET_URL}" target="_blank" rel="noopener">Buka spreadsheet</a><button class="btn primary" type="button" onclick="this.closest('dialog').close()">Tutup</button></div></footer></div></dialog>`);

  function list() {
    const q = S.q.trim().toLowerCase();
    const L = S.rows.filter(r => (!S.st || String(r.stage) === S.st) && (!S.proker || r.proker === S.proker) && (!q || [r.judul, r.proker, r.noKontrak, r.stageName].join(" ").toLowerCase().includes(q)));
    const { k, dir } = S.sort;
    return L.sort((a, b) => (typeof a[k] === "string" ? String(a[k] || "").localeCompare(String(b[k] || "")) : (a[k] || 0) - (b[k] || 0)) * dir || a.no - b.no);
  }
  function render() {
    const all = S.rows, n = all.length;
    const rab = all.reduce((a, r) => a + r.rab, 0), kon = all.reduce((a, r) => a + r.kontrak, 0);
    const paid = all.filter(r => r.stage === 6).reduce((a, r) => a + (r.kontrak || r.rab), 0);
    const both = all.filter(r => r.rab && r.kontrak), eff = both.reduce((a, r) => a + (r.rab - r.kontrak), 0), effBase = both.reduce((a, r) => a + r.rab, 0);
    const avg = n ? all.reduce((a, r) => a + r.progres, 0) / n : 0;
    $("#aoKpi").innerHTML = [
      ["Program kerja", n, "doc", "primary", `${all.filter(r => r.stage === 6).length} terbayar · ${all.filter(r => r.stage && r.stage < 6).length} berjalan`],
      ["Total nilai RAB", rpShort(rab), "bars", "primary", `${all.filter(r => r.rab).length} program dengan RAB`],
      ["Total nilai kontrak", rpShort(kon), "check", "p3", `${all.filter(r => r.kontrak).length} program sudah kontrak`],
      ["Sudah terbayar", rpShort(paid), "shield", "p3", kon ? `${pct(paid / kon)} dari nilai kontrak` : "—"],
      ["Efisiensi RAB → kontrak", rpShort(eff), "pulse", "p2", effBase ? `${(eff / effBase * 100).toFixed(2).replace(".", ",")}% dari RAB (${both.length} program)` : "—"],
      ["Rata-rata progres", pct(avg), "rotate", "primary", "Berdasarkan tahapan proker"]
    ].map(([l, v, ic, t, sub]) => `<div class="card kpi tone-${t}"><div class="kpi-icon">${icon(ic === "bars" ? "doc" : ic)}</div><div><div class="kpi-label">${l}</div><div class="kpi-value">${v}</div><div class="kpi-sub">${esc(sub)}</div></div></div>`).join("");

    // pipeline tahapan
    const stages = [1, 2, 3, 4, 5, 6].map(s => { const xs = all.filter(r => r.stage === s); return { s, n: xs.length, val: xs.reduce((a, r) => a + (r.kontrak || r.rab), 0), name: (xs[0] && xs[0].stageName) || stageName(s) }; });
    $("#aoPipe").innerHTML = `<div class="ao-pipe">${stages.map(x => `<button type="button" class="ao-step${x.n ? "" : " empty"}${S.st === String(x.s) ? " on" : ""}" data-st="${x.s}" style="--c:${STAGE_C[x.s]}" ${x.n ? "" : "disabled"}>
        <span class="ao-step-no">${x.s}</span><span class="ao-step-name">${esc(x.name)}</span><b>${x.n}</b><small>${x.n ? rpShort(x.val) : "—"}</small>
        <i class="ao-step-bar" style="width:${n ? x.n / n * 100 : 0}%"></i></button>`).join("")}</div>`;

    // serapan anggaran
    const mx = Math.max(rab, kon, 1);
    $("#aoFunds").innerHTML = `<ul class="bars ab-bars ao-funds">${[["Total RAB", rab, "var(--text-3)"], ["Nilai kontrak", kon, "var(--primary)"], ["Sudah terbayar", paid, "var(--ok)"]]
      .map(([l, v, c]) => `<li><span class="bl">${l}</span><span class="bt"><i style="width:${v / mx * 100}%;background:${c}"></i></span><b>${rpShort(v)}</b></li>`).join("")}</ul>
      <div class="ao-donut-row">${donut(all)}</div>`;

    // per proker
    const pm = new Map(); all.forEach(r => { const k = r.proker || "(tanpa proker)"; const o = pm.get(k) || { n: 0, v: 0 }; o.n++; o.v += r.kontrak || r.rab; pm.set(k, o); });
    const pk = [...pm.entries()].sort((a, b) => b[1].v - a[1].v), mxp = Math.max(1, ...pk.map(x => x[1].v));
    $("#aoProker").innerHTML = `<ul class="bars ab-bars ao-proker">${pk.map(([k, o]) => `<li class="clickable${S.proker === k ? " on" : ""}" data-proker="${esc(k)}" title="${esc(k)}: ${o.n} program · ${rp(o.v)}">
      <span class="bl">${esc(k.replace(/\s*\n\s*/g, " "))}<small>${o.n} program</small></span><span class="bt"><i style="width:${o.v / mxp * 100}%;background:var(--primary)"></i></span><b>${rpShort(o.v)}</b></li>`).join("")}</ul>`;

    // filter tahapan
    $("#aoSt").innerHTML = [["", "Semua", n], ...stages.filter(x => x.n).map(x => [String(x.s), `${x.s}. ${x.name}`, x.n])].map(([v, l, c]) =>
      `<button type="button" class="ab-chip${S.st === v ? " on" : ""}" data-st="${v}" aria-pressed="${S.st === v}"><span>${esc(l)}</span><em>${c}</em></button>`).join("");

    // tabel
    const L = list(), { k, dir } = S.sort;
    const th = (key, label, num) => `<th class="${num ? "num " : ""}sortable${k === key ? " on" : ""}" data-sort="${key}">${label}${k === key ? (dir < 0 ? " ▾" : " ▴") : ""}</th>`;
    $("#aoHead").innerHTML = `<tr>${th("no", "No", 1)}${th("judul", "Program kerja")}${th("rab", "Nilai RAB", 1)}${th("kontrak", "Nilai kontrak", 1)}<th class="num">Selisih</th>${th("stage", "Status")}${th("progres", "Progres", 1)}<th>No. kontrak</th></tr>`;
    $("#aoRows").innerHTML = L.map(r => { const d = r.rab && r.kontrak ? r.rab - r.kontrak : null; return `<tr data-i="${r._i}" tabindex="0">
      <td class="num no">${r.no}</td><td class="ao-judul"><b>${esc(r.judul || "—")}</b><div class="muted sm">${esc(String(r.proker || "").replace(/\s*\n\s*/g, " "))}</div></td>
      <td class="num">${r.rab ? rp(r.rab) : `<span class="muted">—</span>`}</td><td class="num">${r.kontrak ? rp(r.kontrak) : `<span class="muted">Belum kontrak</span>`}</td>
      <td class="num">${d != null ? `<span class="${d >= 0 ? "ao-pos" : "ao-neg"}">${rp(d)}</span>` : `<span class="muted">—</span>`}</td>
      <td>${chip(r)}</td><td class="num">${bar(r.progres)}<b class="ao-pct">${pct(r.progres)}</b></td><td class="sm ao-nok">${esc(r.noKontrak || "—")}</td></tr>`; }).join("");
    $("#aoEmpty").hidden = L.length > 0;
    $("#aoShown").innerHTML = `Menampilkan <b>${L.length}</b> program kerja${S.proker ? ` · proker <b>${esc(S.proker.replace(/\s*\n\s*/g, " "))}</b> <button type="button" class="linkbtn" data-clear="proker">hapus filter</button>` : ""}`;
    $("#aoCount").textContent = `${L.length} dari ${n} program · nilai ${rpShort(L.reduce((a, r) => a + (r.kontrak || r.rab), 0))}`;
    $("#aoFoot").textContent = S.live ? `Sumber: spreadsheet RKAU · sheet ${SHEET} (live)` : `Sumber: data cadangan ${DOC.generated || ""}`;
  }
  function donut(all) {
    const n = all.length, seg = [6, 5, 4, 3, 2, 1, 0].map(s => [s, all.filter(r => r.stage === s).length]).filter(x => x[1]);
    let acc = 0;
    const circles = seg.map(([s, v]) => { const p = v / Math.max(n, 1) * 100, c = `<circle cx="50" cy="50" r="40" pathLength="100" style="stroke:${STAGE_C[s] || "var(--text-3)"};stroke-dasharray:${Math.max(p - .6, .4)} ${100 - p + .6};stroke-dashoffset:${-acc}"><title>${stageName(s)}: ${v}</title></circle>`; acc += p; return c; }).join("");
    return `<svg class="donut" viewBox="0 0 100 100" role="img" aria-label="Komposisi tahapan"><circle cx="50" cy="50" r="40" class="d-track"/>${circles}<text x="50" y="49" class="d-total">${n}</text><text x="50" y="61" class="d-cap">program</text></svg>
      <ul class="plist">${seg.map(([s, v]) => `<li><i class="swatch" style="background:${STAGE_C[s] || "var(--text-3)"}"></i><span>${s ? s + ". " : ""}${esc(stageName(s))}</span><b>${v}</b><em>${pct(v / n)}</em></li>`).join("")}</ul>`;
  }
  function openDetail(i) {
    const r = S.rows[i]; if (!r) return;
    $("#aoDetTitle").textContent = r.judul || "Program kerja";
    $("#aoDetSub").innerHTML = `No ${r.no} ${chip(r)}`;
    const it = (l, v, cls) => `<div${cls ? ` class="${cls}"` : ""}><dt>${l}</dt><dd class="${v ? "pre" : "nil"}">${v || "—"}</dd></div>`;
    const d = r.rab && r.kontrak ? r.rab - r.kontrak : null;
    $("#aoDetBody").innerHTML = `<dl class="dgrid">${it("Proker RKAU", esc(r.proker), "wide")}${it("Nilai RAB", r.rab ? rp(r.rab) : "")}${it("Nilai kontrak", r.kontrak ? rp(r.kontrak) : "Belum kontrak")}
      ${it("Selisih (efisiensi)", d != null ? rp(d) + (r.rab ? ` <span class="muted">(${(d / r.rab * 100).toFixed(2).replace(".", ",")}%)</span>` : "") : "")}${it("No. kontrak", esc(r.noKontrak))}
      ${it("Status", chip(r))}${it("Progres", `${bar(r.progres)} <b>${pct(r.progres)}</b>`, "span2")}</dl>
      <div class="ao-steps-mini">${[1, 2, 3, 4, 5, 6].map(s => `<span class="${s <= r.stage ? "done" : ""}${s === r.stage ? " now" : ""}" style="--c:${STAGE_C[s]}"><i>${s}</i>${esc(stageName(s))}</span>`).join("")}</div>`;
    $("#aoDetail").showModal();
  }

  /* ---------- Muat live dari spreadsheet ---------- */
  function setSync(st, t, note) { $("#aoSync").className = "chip sync " + st; $("#aoSync").innerHTML = `<i class="live-dot"></i>${esc(t)}`; $("#aoSyncNote").textContent = note || ""; sec.classList.toggle("page-loading", st === "loading"); }
  async function load() {
    setSync("loading", "Memuat dari Google Sheets…");
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET)}&_=${Date.now()}`;
      const txt = await (await fetch(url, { cache: "no-store" })).text();
      const j = JSON.parse(txt.slice(txt.indexOf("(") + 1, txt.lastIndexOf(")")));
      if (j.status !== "ok") throw new Error((j.errors && j.errors[0] && (j.errors[0].detailed_message || j.errors[0].message)) || "Gagal membaca sheet");
      const rows = j.table.rows.map(r => { const c = (r.c || []).map(x => x || {}); const v = i => (c[i] || {}).v ?? null;
        return { no: v(0), proker: v(1), judul: v(2), rab: v(3), kontrak: v(4), status: v(5), progres: v(6), noKontrak: v(8) }; }).filter(r => r.judul || r.proker);
      S.rows = norm(rows); S.live = true; S.loadedAt = new Date();
      setSync("live", "Live · Google Sheets", `Sheet ${SHEET} · ${rows.length} program · dimuat ${S.loadedAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`);
    } catch (e) {
      S.live = false;
      setSync("error", "Gagal terhubung · menampilkan data cadangan", "Pastikan spreadsheet dibagikan “Anyone with the link – Viewer”. " + String(e.message || e));
    }
    render(); changed();
  }
  function changed() { if (location.hash === "#ao" && typeof setUpdated === "function") setUpdated("ao"); if (window.homeRefresh) window.homeRefresh(); }
  window.PAGE_UPDATED = window.PAGE_UPDATED || {};
  window.PAGE_UPDATED.ao = () => {
    const d = S.live && S.loadedAt ? S.loadedAt : (DOC.generated ? new Date(DOC.generated + "T00:00:00") : null);
    if (!d) return null;
    const pad = x => String(x).padStart(2, "0"), date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    return { date, title: S.live ? `Data live dari spreadsheet, dimuat pukul ${pad(d.getHours())}.${pad(d.getMinutes())}` : "Data cadangan" };
  };
  window.AO_SUMMARY = () => ({ n: S.rows.length, kontrak: S.rows.reduce((a, r) => a + r.kontrak, 0), paid: S.rows.filter(r => r.stage === 6).length, live: S.live, rpShort });

  /* ---------- Event ---------- */
  $("#aoReload").addEventListener("click", load);
  $("#aoSearch").addEventListener("input", e => { S.q = e.target.value; render(); });
  sec.addEventListener("click", e => {
    const st = e.target.closest("[data-st]"); if (st && !st.disabled) { S.st = S.st === st.dataset.st && st.classList.contains("ao-step") ? "" : st.dataset.st; return render(); }
    const pk = e.target.closest("[data-proker]"); if (pk) { S.proker = S.proker === pk.dataset.proker ? "" : pk.dataset.proker; return render(); }
    if (e.target.closest("[data-clear]")) { S.proker = ""; return render(); }
    const so = e.target.closest("[data-sort]"); if (so) { const k = so.dataset.sort; S.sort = { k, dir: S.sort.k === k ? -S.sort.dir : (k === "no" || k === "judul" ? 1 : -1) }; return render(); }
    const tr = e.target.closest("#aoRows tr[data-i]"); if (tr) openDetail(+tr.dataset.i);
  });
  $("#aoRows").addEventListener("keydown", e => { const tr = e.target.closest("tr[data-i]"); if (tr && e.key === "Enter") openDetail(+tr.dataset.i); });
  $("#aoDetail").addEventListener("click", e => { if (e.target === $("#aoDetail")) $("#aoDetail").close(); });

  render();
  load();
})();
