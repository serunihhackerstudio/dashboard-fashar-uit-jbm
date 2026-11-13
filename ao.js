/* =========================================================
   MENU AO (section RKAU) — Monitoring program kerja AO
   Data dibaca lewat Apps Script (doPost action "ao_get"). Tanpa token, server hanya mengirim
   angka pengganti untuk nilai rupiah dan semua nilai rupiah ditampilkan buram (blur).
   Token dimasukkan sekali dan disimpan di komputer/browser pengguna (localStorage).
   ========================================================= */
(function () {
  const sec = $("#page-ao");
  if (!sec) return;
  const API = (window.FASHAR_CONFIG && window.FASHAR_CONFIG.trafoDbApi || "").trim();
  const AO_TOKEN_KEY = "fashar-ao-token";
  const aoTokGet = () => { try { return localStorage.getItem(AO_TOKEN_KEY) || ""; } catch (e) { return ""; } };
  const aoTokSet = t => { try { t ? localStorage.setItem(AO_TOKEN_KEY, t) : localStorage.removeItem(AO_TOKEN_KEY); } catch (e) { } };
  const SHEET = "MONITORING AO", SHEET_URL = "https://docs.google.com/spreadsheets/d/1RpPBoPXkaPu98nO41LXEuttQi8YkP3AO6xSPRmg-0M0/edit";
  const STAGE_DEF = { 1: "Penyusunan RAB", 2: "Permohonan PA", 3: "Proses Kontrak Laksda", 4: "Pelaksanaan Pekerjaan", 5: "Proses IPMS & VIP", 6: "Terbayar" };
  const STAGE_C = { 1: "var(--text-3)", 2: "var(--violet)", 3: "var(--p2)", 4: "var(--primary)", 5: "#0ea5a4", 6: "var(--ok)" };
  const PAGU_SHEET = "PROGRES PAGU";
  const S = { masked: true, paguPct: 0, pagu: [], paguLive: false, rows: [], q: "", st: "", proker: "", live: false, loadedAt: null, sort: { k: "no", dir: 1 } };
  const svg = p => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;

  /* PROGRES PAGU: pagu, realisasi, sisa & rincian pekerjaan per proker RKAU */
  function normPagu(rows) {
    return (rows || []).map((r, i) => {
      const pagu = Number(r.pagu) || 0, real = Number(r.realisasi) || 0;
      return { ...r, _i: i, program: String(r.program || "").replace(/\s+/g, " ").trim(), pagu, real, sisa: pagu - real, pct: pagu ? real / pagu : 0,
        rincian: (r.rincian || []).map(x => ({ pekerjaan: String(x.pekerjaan || "").replace(/\.pdfs?$/i, "").replace(/\s+/g, " ").trim(), nilai: Number(x.nilai) || 0 })) };
    });
  }
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
  const BLUR = `<span class="ao-blur" data-unlock role="button" tabindex="0" title="Masukkan token akses untuk melihat nilai">Rp 000.000.000</span>`;
  const rpRaw = n => "Rp " + Math.round(n || 0).toLocaleString("id-ID");
  const rp = n => S.masked ? BLUR : rpRaw(n);
  const M = t => S.masked ? BLUR.replace("Rp 000.000.000", "00% dari 000") : t;
  const rpShort = n => { n = n || 0; return n >= 1e9 ? "Rp " + (n / 1e9).toFixed(2).replace(".", ",") + " M" : n >= 1e6 ? "Rp " + (n / 1e6).toFixed(1).replace(".", ",") + " jt" : rpRaw(n); };
  const nok = v => !v ? "" : S.masked ? BLUR.replace("Rp 000.000.000", "000/XXXXX/XXXX/2026") : esc(v);
  const rpS = n => S.masked ? BLUR : rpShort(n);
  const pct = x => Math.round((x || 0) * 100) + "%";
  const stageName = s => STAGE_DEF[s] || "Belum diisi";
  const chip = r => `<span class="badge ao-st" style="--c:${STAGE_C[r.stage] || "var(--text-3)"}">${r.stage ? r.stage + ". " : ""}${esc(r.stageName)}</span>`;
  const bar = p => `<span class="ao-prog"><i style="width:${Math.min(100, p * 100)}%;background:${p >= 1 ? "var(--ok)" : p >= .67 ? "var(--primary)" : "var(--p2)"}"></i></span>`;

  sec.innerHTML = `
   <div id="aoMain">
   <div class="tdb-bar card ab-bar">
    <div class="tdb-bar-info"><span class="chip sync" id="aoSync"></span><span class="muted sm" id="aoSyncNote"></span></div>
    <div class="tdb-actions"><button class="btn ghost" type="button" id="aoReload">${svg('<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8M21 3v5h-5"/>')}Muat ulang</button>
     <button class="btn ghost" type="button" id="aoUnlock"></button>
     <a class="btn primary" href="${SHEET_URL}" target="_blank" rel="noopener">${svg('<path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>')}Buka spreadsheet</a></div>
   </div>
   <div class="ab-kpis" id="aoKpi"></div>
   <div class="card ao-pagu-card"><div class="card-head"><div><h3>Progres penyerapan pagu</h3><p>Pagu, realisasi & sisa per proker RKAU · sheet “${esc(PAGU_SHEET)}” · klik baris untuk rincian pekerjaan</p></div></div><div class="card-body" id="aoPagu"></div></div>
   <div class="card ao-pipe-card"><div class="card-head"><div><h3>Tahapan program kerja</h3><p>Jumlah program & nilai per tahapan · klik untuk memfilter</p></div></div><div class="card-body" id="aoPipe"></div></div>
   <div class="ab-filters ao-filters">
    <div class="ab-chips" id="aoSt" role="group" aria-label="Filter tahapan"></div>
    <div class="ab-filter-right"><div class="search"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="aoSearch" type="search" placeholder="Cari program kerja, proker, no. kontrak…" aria-label="Cari program kerja"></div></div>
   </div>
   <p class="muted ab-shown" id="aoShown"></p>
   <div class="card">
    <div class="table-wrap ab-table ao-table"><table class="table"><thead id="aoHead"></thead><tbody id="aoRows"></tbody></table><div class="empty" id="aoEmpty" hidden>Tidak ada program kerja yang cocok.</div></div>
    <div class="card-foot tdb-foot"><span class="muted" id="aoCount"></span><span class="muted sm" id="aoFoot"></span></div>
   </div>
   </div>`;
  document.body.insertAdjacentHTML("beforeend", `<dialog class="modal ao-lock-dlg" id="aoLock" aria-labelledby="aoLockTitle"><form class="ao-lock-card" id="aoLockForm" autocomplete="off">
     <button class="icon-btn ao-lock-x" type="button" onclick="this.closest('dialog').close()" aria-label="Tutup">${svg('<path d="M6 6l12 12M18 6 6 18"/>')}</button>
     <div class="ao-lock-ic">${svg('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>')}</div>
     <h3 id="aoLockTitle">Nilai rupiah dirahasiakan</h3>
     <p class="muted">Masukkan token akses untuk menampilkan semua nilai rupiah di menu AO. Token cukup dimasukkan sekali dan akan diingat di komputer ini.</p>
     <input type="password" id="aoTok" placeholder="Token akses" aria-label="Token akses" required>
     <p class="ao-lock-err" id="aoLockErr" hidden></p>
     <button class="btn primary" type="submit" id="aoLockBtn">Tampilkan nilai</button>
    </form></dialog>`);
  document.body.insertAdjacentHTML("beforeend", `<dialog class="modal" id="aoDetail" aria-labelledby="aoDetTitle"><div class="modal-wrap">
   <header class="modal-head"><div><h3 id="aoDetTitle"></h3><p id="aoDetSub"></p></div><button class="icon-btn" type="button" onclick="this.closest('dialog').close()" aria-label="Tutup">${svg('<path d="M6 6l12 12M18 6 6 18"/>')}</button></header>
   <div class="modal-body" id="aoDetBody"></div>
   <footer class="modal-foot"><div class="modal-btns"><a class="btn ghost" href="${SHEET_URL}" target="_blank" rel="noopener">Buka spreadsheet</a><button class="btn primary" type="button" onclick="this.closest('dialog').close()">Tutup</button></div></footer></div></dialog>`);

  function renderPagu() {
    const P = S.pagu, tp = P.reduce((a, r) => a + r.pagu, 0), tr = P.reduce((a, r) => a + r.real, 0), ts = tp - tr, tpct = S.masked ? S.paguPct : tp ? tr / tp : 0;
    const L = P.slice().sort((a, b) => b.pagu - a.pagu), mx = Math.max(1, ...L.map(r => r.pagu));
    const col = p => p >= .95 ? "var(--ok)" : p >= .5 ? "var(--primary)" : "var(--p2)";
    $("#aoPagu").innerHTML = P.length ? `
      <div class="ao-pagu-sum">
        <div><span>Total pagu</span><b>${rpS(tp)}</b><small>${rp(tp)}</small></div>
        <div><span>Realisasi (terserap)</span><b style="color:var(--primary)">${rpS(tr)}</b><small>${rp(tr)}</small></div>
        <div><span>Sisa pagu</span><b style="color:${ts > 0 ? "var(--p2)" : "var(--ok)"}">${rpS(ts)}</b><small>${rp(ts)}</small></div>
        <div class="ao-pagu-gauge"><span>Progres penyerapan</span><b>${pct(tpct)}</b><span class="ao-gbar"><i style="width:${Math.min(100, tpct * 100)}%"></i></span></div>
      </div>
      <ul class="ao-pagu-list">${L.map(r => `<li data-pagu="${r._i}" tabindex="0" title="Klik untuk rincian pekerjaan">
        <div class="ao-pl-name"><b>${esc(r.program)}</b><small>${r.rincian.length} pekerjaan</small></div>
        <div class="ao-pl-bar"><span class="ao-pl-track" style="width:${r.pagu / mx * 100}%"><i style="width:${Math.min(100, r.pct * 100)}%;background:${col(r.pct)}"></i></span></div>
        <div class="ao-pl-num">${r.pagu ? `<b>${pct(r.pct)}</b><small>${rpS(r.real)} / ${rpS(r.pagu)}</small><small class="${r.sisa > 0 ? "ao-sisa" : "ao-habis"}">${r.sisa > 0 ? "sisa " + rpS(r.sisa) : r.sisa < 0 ? "lebih " + rpS(-r.sisa) : "terserap penuh"}</small>` : `<small class="muted">Pagu belum diisi</small>`}</div></li>`).join("")}</ul>`
      : `<p class="dnil">Data PROGRES PAGU belum tersedia.</p>`;
  }
  function openPagu(i) {
    const r = S.pagu[i]; if (!r) return;
    $("#aoDetTitle").textContent = r.program;
    $("#aoDetSub").innerHTML = `Proker RKAU · penyerapan <b>${pct(r.pct)}</b>`;
    const mx = Math.max(1, ...r.rincian.map(x => x.nilai));
    $("#aoDetBody").innerHTML = `<dl class="dgrid">${[["Pagu", rp(r.pagu)], ["Realisasi", rp(r.real)], ["Sisa", rp(r.sisa)], ["Penyerapan", pct(r.pct)]].map(([l, v]) => `<div><dt>${l}</dt><dd>${v}</dd></div>`).join("")}</dl>
      <span class="ao-gbar big"><i style="width:${Math.min(100, r.pct * 100)}%"></i></span>
      <section class="dsec"><h4>Rincian realisasi per pekerjaan <small>${r.rincian.length} pekerjaan</small></h4>
      ${r.rincian.length ? `<ul class="bars ab-bars ao-rinci">${r.rincian.sort((a, b) => b.nilai - a.nilai).map(x => `<li title="${esc(x.pekerjaan)}"><span class="bl">${esc(x.pekerjaan)}</span><span class="bt"><i style="width:${x.nilai / mx * 100}%;background:var(--primary)"></i></span><b>${rpS(x.nilai)}</b></li>`).join("")}</ul>` : `<p class="muted sm">Belum ada rincian pekerjaan.</p>`}</section>`;
    $("#aoDetail").showModal();
  }
  function list() {
    const q = S.q.trim().toLowerCase();
    const L = S.rows.filter(r => (!S.st || String(r.stage) === S.st) && (!S.proker || r.proker === S.proker) && (!q || [r.judul, r.proker, S.masked ? "" : r.noKontrak, r.stageName].join(" ").toLowerCase().includes(q)));
    const { k, dir } = S.sort;
    return L.sort((a, b) => (typeof a[k] === "string" ? String(a[k] || "").localeCompare(String(b[k] || "")) : (a[k] || 0) - (b[k] || 0)) * dir || a.no - b.no);
  }
  function render() {
    renderPagu();
    const all = S.rows, n = all.length;
    const rab = all.reduce((a, r) => a + r.rab, 0), kon = all.reduce((a, r) => a + r.kontrak, 0);
    const paid = all.filter(r => r.stage === 6).reduce((a, r) => a + (r.kontrak || r.rab), 0);
    const both = all.filter(r => r.rab && r.kontrak), eff = both.reduce((a, r) => a + (r.rab - r.kontrak), 0), effBase = both.reduce((a, r) => a + r.rab, 0);
    $("#aoKpi").innerHTML = [
      ["Program kerja", n, "doc", "primary", `${all.filter(r => r.stage === 6).length} terbayar · ${all.filter(r => r.stage && r.stage < 6).length} berjalan`],
      ["Total nilai RAB", rpS(rab), "bars", "primary", `${all.filter(r => r.rab).length} program dengan RAB`],
      ["Total nilai kontrak", rpS(kon), "check", "p3", `${all.filter(r => r.kontrak).length} program sudah kontrak`],
      ["Sudah terbayar", rpS(paid), "shield", "p3", kon ? M(`${pct(paid / kon)} dari nilai kontrak`) : "—"],
      ["Efisiensi RAB → kontrak", rpS(eff), "pulse", "p2", effBase ? M(`${(eff / effBase * 100).toFixed(2).replace(".", ",")}% dari RAB`) + ` (${both.length} program)` : "—"]
    ].map(([l, v, ic, t, sub]) => `<div class="card kpi tone-${t}"><div class="kpi-icon">${icon(ic === "bars" ? "doc" : ic)}</div><div><div class="kpi-label">${l}</div><div class="kpi-value">${v}</div><div class="kpi-sub">${sub}</div></div></div>`).join("");

    // pipeline tahapan
    const stages = [1, 2, 3, 4, 5, 6].map(s => { const xs = all.filter(r => r.stage === s); return { s, n: xs.length, val: xs.reduce((a, r) => a + (r.kontrak || r.rab), 0), name: (xs[0] && xs[0].stageName) || stageName(s) }; });
    $("#aoPipe").innerHTML = `<div class="ao-pipe">${stages.map(x => `<button type="button" class="ao-step${x.n ? "" : " empty"}${S.st === String(x.s) ? " on" : ""}" data-st="${x.s}" style="--c:${STAGE_C[x.s]}" ${x.n ? "" : "disabled"}>
        <span class="ao-step-no">${x.s}</span><span class="ao-step-name">${esc(x.name)}</span><b>${x.n}</b><small>${x.n ? rpS(x.val) : "—"}</small>
        <i class="ao-step-bar" style="width:${n ? x.n / n * 100 : 0}%"></i></button>`).join("")}</div>`;

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
      <td>${chip(r)}</td><td class="num">${bar(r.progres)}<b class="ao-pct">${pct(r.progres)}</b></td><td class="sm ao-nok">${nok(r.noKontrak) || "—"}</td></tr>`; }).join("");
    $("#aoEmpty").hidden = L.length > 0;
    $("#aoShown").innerHTML = `Menampilkan <b>${L.length}</b> program kerja${S.proker ? ` · proker <b>${esc(S.proker.replace(/\s*\n\s*/g, " "))}</b> <button type="button" class="linkbtn" data-clear="proker">hapus filter</button>` : ""}`;
    $("#aoCount").innerHTML = `${L.length} dari ${n} program · nilai ${rpS(L.reduce((a, r) => a + (r.kontrak || r.rab), 0))}`;
    $("#aoFoot").textContent = `Sumber: spreadsheet RKAU · sheet ${SHEET}`;
  }
  function openDetail(i) {
    const r = S.rows[i]; if (!r) return;
    $("#aoDetTitle").textContent = r.judul || "Program kerja";
    $("#aoDetSub").innerHTML = `No ${r.no} ${chip(r)}`;
    const it = (l, v, cls) => `<div${cls ? ` class="${cls}"` : ""}><dt>${l}</dt><dd class="${v ? "pre" : "nil"}">${v || "—"}</dd></div>`;
    const d = r.rab && r.kontrak ? r.rab - r.kontrak : null;
    $("#aoDetBody").innerHTML = `<dl class="dgrid">${it("Proker RKAU", esc(r.proker), "wide")}${it("Nilai RAB", r.rab ? rp(r.rab) : "")}${it("Nilai kontrak", r.kontrak ? rp(r.kontrak) : "Belum kontrak")}
      ${it("Selisih (efisiensi)", d != null ? rp(d) + (r.rab && !S.masked ? ` <span class="muted">(${(d / r.rab * 100).toFixed(2).replace(".", ",")}%)</span>` : "") : "")}${it("No. kontrak", nok(r.noKontrak))}
      ${it("Status", chip(r))}${it("Progres", `${bar(r.progres)} <b>${pct(r.progres)}</b>`, "span2")}</dl>
      <div class="ao-steps-mini">${[1, 2, 3, 4, 5, 6].map(s => `<span class="${s <= r.stage ? "done" : ""}${s === r.stage ? " now" : ""}" style="--c:${STAGE_C[s]}"><i>${s}</i>${esc(stageName(s))}</span>`).join("")}</div>`;
    $("#aoDetail").showModal();
  }

  /* ---------- Muat live dari spreadsheet ---------- */
  function setSync(st, t, note) { $("#aoSync").className = "chip sync " + st; $("#aoSync").innerHTML = `<i class="live-dot"></i>${esc(t)}`; $("#aoSyncNote").textContent = note || ""; sec.classList.toggle("page-loading", st === "loading"); }
  function unlockUi() {
    const b = $("#aoUnlock");
    b.innerHTML = S.masked ? `${svg('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>')}Tampilkan nilai`
      : `${svg('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-1.9"/>')}Sembunyikan nilai`;
    b.title = S.masked ? "Masukkan token akses untuk menampilkan nilai rupiah" : "Buramkan lagi nilai rupiah dan hapus token dari komputer ini";
    sec.classList.toggle("ao-masked", S.masked);
  }
  function askToken(msg) {
    $("#aoLockErr").hidden = !msg; $("#aoLockErr").textContent = msg || "";
    $("#aoLockBtn").disabled = false; $("#aoLockBtn").textContent = "Tampilkan nilai";
    if (!$("#aoLock").open) $("#aoLock").showModal();
    setTimeout(() => $("#aoTok").focus(), 50);
  }
  /* tok: token baru dari form (opsional). Tanpa token yang benar, server mengirim nilai rupiah pengganti. */
  async function load(tok) {
    const fromForm = !!tok;
    tok = tok || aoTokGet();
    if (!API) { setSync("error", "URL Apps Script belum diatur di config.js"); return; }
    setSync("loading", "Memuat dari Google Sheets…");
    try {
      const j = await (await fetch(API, { method: "POST", body: JSON.stringify({ token: tok, action: "ao_get" }) })).json();
      if (!j.ok || !Array.isArray(j.rows)) throw new Error(j.error || "Apps Script belum diperbarui (action ao_get belum tersedia).");
      if (j.unlocked) { aoTokSet(tok); if ($("#aoLock").open) $("#aoLock").close(); if (fromForm) toast("Nilai rupiah ditampilkan"); }
      else if (tok) { aoTokSet(""); if (fromForm) askToken("Token salah. Silakan masukkan token yang benar."); }
      S.masked = !j.unlocked; S.paguPct = Number(j.paguPct) || 0;
      S.rows = norm(j.rows); S.pagu = normPagu(j.pagu); S.paguLive = true; S.live = true; S.loadedAt = new Date();
      setSync("live", "Live · Google Sheets", `Sheet ${SHEET} · ${S.rows.length} program · dimuat ${S.loadedAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`);
    } catch (e) {
      if (fromForm) askToken("Gagal memeriksa token: " + String(e.message || e));
      setSync("error", S.rows.length ? "Gagal memuat ulang" : "Gagal memuat data", String(e.message || e));
    }
    unlockUi(); render(); changed();
  }
  function changed() { if (location.hash === "#ao" && typeof setUpdated === "function") setUpdated("ao"); if (window.homeRefresh) window.homeRefresh(); }
  window.PAGE_UPDATED = window.PAGE_UPDATED || {};
  window.PAGE_UPDATED.ao = () => {
    const d = S.live && S.loadedAt ? S.loadedAt : null;
    if (!d) return null;
    const pad = x => String(x).padStart(2, "0"), date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    return { date, title: S.live ? `Data live dari spreadsheet, dimuat pukul ${pad(d.getHours())}.${pad(d.getMinutes())}` : "Data cadangan" };
  };
  sec.addEventListener("keydown", e => { const pg = e.target.closest("[data-pagu]"); if (pg && e.key === "Enter") openPagu(+pg.dataset.pagu); });
  window.AO_SUMMARY = () => !S.live ? null : ({ paguPct: (t => t.p ? t.r / t.p : 0)(S.pagu.reduce((a, r) => ({ p: a.p + r.pagu, r: a.r + r.real }), { p: 0, r: 0 })), n: S.rows.length, kontrak: S.rows.reduce((a, r) => a + r.kontrak, 0), paid: S.rows.filter(r => r.stage === 6).length, live: S.live, rpShort: n => S.masked ? "•••" : rpShort(n) });

  /* ---------- Event ---------- */
  $("#aoReload").addEventListener("click", () => load());
  $("#aoUnlock").addEventListener("click", () => {
    if (S.masked) return askToken();
    aoTokSet(""); $("#aoTok").value = ""; toast("Nilai rupiah diburamkan lagi"); load();
  });
  document.addEventListener("click", e => { if (e.target.closest(".ao-blur[data-unlock]")) { e.preventDefault(); e.stopPropagation(); askToken(); } }, true);
  document.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.closest && e.target.closest(".ao-blur[data-unlock]")) { e.preventDefault(); e.stopPropagation(); askToken(); } }, true);
  $("#aoLock").addEventListener("click", e => { if (e.target === $("#aoLock")) $("#aoLock").close(); });
  $("#aoLockForm").addEventListener("submit", e => {
    e.preventDefault(); const t = $("#aoTok").value.trim(); if (!t) return;
    $("#aoLockBtn").disabled = true; $("#aoLockBtn").textContent = "Memeriksa token…"; $("#aoLockErr").hidden = true;
    load(t).then(() => { $("#aoTok").value = ""; });
  });
  $("#aoSearch").addEventListener("input", e => { S.q = e.target.value; render(); });
  sec.addEventListener("click", e => {
    const st = e.target.closest("[data-st]"); if (st && !st.disabled) { S.st = S.st === st.dataset.st && st.classList.contains("ao-step") ? "" : st.dataset.st; return render(); }
    const pk = e.target.closest("[data-proker]"); if (pk) { S.proker = S.proker === pk.dataset.proker ? "" : pk.dataset.proker; return render(); }
    if (e.target.closest("[data-clear]")) { S.proker = ""; return render(); }
    const so = e.target.closest("[data-sort]"); if (so) { const k = so.dataset.sort; S.sort = { k, dir: S.sort.k === k ? -S.sort.dir : (k === "no" || k === "judul" ? 1 : -1) }; return render(); }
    const pg = e.target.closest("[data-pagu]"); if (pg) return openPagu(+pg.dataset.pagu);
    const tr = e.target.closest("#aoRows tr[data-i]"); if (tr) openDetail(+tr.dataset.i);
  });
  $("#aoRows").addEventListener("keydown", e => { const tr = e.target.closest("tr[data-i]"); if (tr && e.key === "Enter") openDetail(+tr.dataset.i); });
  $("#aoDetail").addEventListener("click", e => { if (e.target === $("#aoDetail")) $("#aoDetail").close(); });

  unlockUi(); render();
  load();
})();
