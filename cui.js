/* =========================================================
   MENU CUI JARVIS — Climb Up Inspection tower transmisi
   Sumber: window.CUI_JARVIS (data/cui-jarvis.js, dari tools/jarvis_to_js.py)
   ========================================================= */
(function () {
  if (!$("#page-cui")) return;

  /* ---------- Definisi item inspeksi ---------- */
  const SECTIONS = { bottom: "Bottom Section Tower", mid: "Mid Section", top: "Top Section Fasa", ew: "Top Section Earth Wire" };
  const ITEMS = [
    ["halaman", "Halaman Tower", "bottom"], ["acd", "ACD", "bottom"], ["chimney", "Chimney", "bottom"], ["stub", "Stub", "bottom"],
    ["nomor", "Nomor Tower", "bottom"], ["plat", "Plat Tanda Bahaya", "bottom"], ["stepbolt", "Step Bolt", "bottom"],
    ["row", "Right of Way (ROW)", "mid"],
    ["isolator", "Isolator", "top"], ["aksCold", "Aksesoris Sisi Cold", "top"], ["aksHot", "Aksesoris Sisi Hot", "top"], ["konduktor", "Konduktor", "top"], ["gap", "Gap Arching", "top"],
    ["ewKond1", "Konduktor EW Line 1", "ew"], ["ewKond2", "Konduktor EW Line 2", "ew"], ["ewAks1", "Aksesoris EW Line 1", "ew"], ["ewAks2", "Aksesoris EW Line 2", "ew"]
  ].map(([k, label, sec]) => ({ k, label, sec, lvl: sec === "top" ? "klem" : "tower" })); // hanya Top Section Fasa dicatat per klem
  const ITEM = Object.fromEntries(ITEMS.map(i => [i.k, i]));
  const OK_VALUES = new Set(["NORMAL", "BERSIH / NORMAL", "ADA / LENGKAP", "ADA", "LENGKAP", "SESUAI STANDAR"]);
  const SEV = {
    kritis: { label: "Kritis", rank: 6, color: "var(--sev-kritis)" }, p1: { label: "Korosi P1", rank: 5, color: "var(--p1)" },
    p2: { label: "Korosi P2", rank: 4, color: "var(--sev-p2)" }, p3: { label: "Korosi P3", rank: 3, color: "var(--sev-p3)" },
    lain: { label: "Temuan lain", rank: 2, color: "var(--violet)" }, ok: { label: "Normal", rank: 1, color: "var(--ok)" }, na: { label: "Tidak diisi", rank: 0, color: "var(--track)" }
  };
  function sev(v) {
    v = String(v || "").trim().toUpperCase();
    if (!v || v === "-") return "na";
    if (OK_VALUES.has(v)) return "ok";
    if (/P1\b/.test(v)) return "p1";
    if (/P2\b/.test(v)) return "p2";
    if (/P3\b/.test(v)) return "p3";
    if (/PECAH|RANTAS|RETAK|KRITIS/.test(v)) return "kritis";
    return "lain";
  }
  const sevChip = (s, text) => `<span class="badge sev sev-${s}">${esc(text || SEV[s].label)}</span>`;
  const fmtD = d => { const m = String(d || "").match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}-${m[2]}-${m[1]}` : (d || "—"); };
  const pct = (a, b) => b ? (a / b * 100).toFixed(1).replace(".", ",") + "%" : "0%";

  /* ---------- Data ---------- */
  const S = { rows: [], source: "", periode: null, uploaded: false,
    f: { upt: "", ultg: "", peng: "", from: "", to: "", q: "", only: false, item: null },
    page: 1, all: false, sort: { k: "risk", dir: -1 }, detail: null };
  function load(doc, uploaded) {
    const K = doc.keys;
    S.rows = doc.rows.map((r, i) => { const o = { _i: i }; K.forEach((k, j) => { o[k] = doc.dict[k][r[j]]; }); return o; });
    S.source = doc.source; S.periode = doc.periode; S.uploaded = !!uploaded;
    S.f = { upt: "", ultg: "", peng: "", from: "", to: "", q: "", only: false, item: null };
    S.rows.forEach(r => { r._t = temuanOf(r); r._worst = r._t.length ? r._t[0].s : "ok"; });
  }
  /* Temuan satu baris (klem): item tingkat tower + item klem; diurutkan dari yang terparah */
  function temuanOf(r) {
    return ITEMS.map(i => ({ i, v: r[i.k], s: sev(r[i.k]) })).filter(x => x.s !== "ok" && x.s !== "na").sort((a, b) => SEV[b.s].rank - SEV[a.s].rank);
  }

  /* ---------- Filter ---------- */
  function filtered(skipItem) {
    const f = S.f, q = f.q.trim().toLowerCase();
    return S.rows.filter(r => (!f.upt || r.upt === f.upt) && (!f.ultg || r.ultg === f.ultg) && (!f.peng || r.penghantar === f.peng)
      && (!f.from || r.tanggal >= f.from) && (!f.to || r.tanggal <= f.to)
      && (!q || (r.lokasi + " " + r.clamp + " " + r.penghantar + " " + r.gi).toLowerCase().includes(q))
      && (skipItem || !f.item || r[f.item.k] === f.item.v));
  }
  function towersOf(rows) {
    const m = new Map();
    rows.forEach(r => { let t = m.get(r.lokasi); if (!t) m.set(r.lokasi, t = { lokasi: r.lokasi, upt: r.upt, ultg: r.ultg, gi: r.gi, penghantar: r.penghantar, tanggal: r.tanggal, first: r, rows: [] }); t.rows.push(r); if (r.tanggal < t.tanggal) t.tanggal = r.tanggal; });
    return [...m.values()];
  }
  /* Hitung kemunculan tiap tingkat keparahan: item tower dihitung sekali per tower, item klem per baris */
  function sevCount(rows, towers) {
    const c = { kritis: 0, p1: 0, p2: 0, p3: 0, lain: 0 };
    towers.forEach(t => ITEMS.filter(i => i.lvl === "tower").forEach(i => { const s = sev(t.first[i.k]); if (s in c) c[s]++; }));
    rows.forEach(r => ITEMS.filter(i => i.lvl === "klem").forEach(i => { const s = sev(r[i.k]); if (s in c) c[s]++; }));
    return c;
  }
  const towerHasTemuan = t => t.rows.some(r => r._t.length);

  function fillSelect(id, values, cur, all) {
    $(id).innerHTML = `<option value="">${all}</option>` + values.map(v => `<option${v === cur ? " selected" : ""}>${esc(v)}</option>`).join("");
  }
  function renderFilters() {
    const f = S.f, uniq = (rows, k) => [...new Set(rows.map(r => r[k]))].sort();
    fillSelect("#cuiUpt", uniq(S.rows, "upt"), f.upt, "Semua UPT");
    const r1 = S.rows.filter(r => !f.upt || r.upt === f.upt);
    if (f.ultg && !r1.some(r => r.ultg === f.ultg)) f.ultg = "";
    fillSelect("#cuiUltg", uniq(r1, "ultg"), f.ultg, "Semua ULTG");
    const r2 = r1.filter(r => !f.ultg || r.ultg === f.ultg);
    if (f.peng && !r2.some(r => r.penghantar === f.peng)) f.peng = "";
    fillSelect("#cuiPeng", uniq(r2, "penghantar"), f.peng, "Semua penghantar");
    $("#cuiFrom").value = f.from; $("#cuiTo").value = f.to;
    if (S.periode) { $("#cuiFrom").min = $("#cuiTo").min = S.periode[0]; $("#cuiFrom").max = $("#cuiTo").max = S.periode[1]; }
    $("#cuiSrc").innerHTML = `Sumber: <b>${esc(S.source)}</b> · periode ${fmtD(S.periode && S.periode[0])} – ${fmtD(S.periode && S.periode[1])} · ${fmt(S.rows.length)} klem` +
      (S.uploaded ? ` <span class="badge warn">dimuat dari file — belum tersimpan permanen</span>` : "");
  }

  /* ---------- Ringkasan & grafik ---------- */
  function renderSummary(rows, towers) {
    const withT = towers.filter(towerHasTemuan).length, c = sevCount(rows, towers);
    $("#cuiKpi").innerHTML = [
      ["Tower diinspeksi", fmt(towers.length), "tower", "primary", `${fmt(rows.length)} titik klem`],
      ["Tower dengan temuan", fmt(withT), "alert", "p2", `${pct(withT, towers.length)} dari tower diinspeksi`],
      ["Temuan kritis", fmt(c.kritis), "x", "p1", "Pecah, rantas, retak, ROW kritis"],
      ["Korosi P1", fmt(c.p1), "alert", "p1", `P2 ${fmt(c.p2)} · P3 ${fmt(c.p3)}`],
      ["Temuan lain", fmt(c.lain), "search", "p3", "Kotor, tidak ada, tidak standar, dll."]
    ].map(([l, v, ic, tone, sub]) => `<div class="card kpi tone-${tone}"><div class="kpi-icon">${icon(ic)}</div><div><div class="kpi-label">${l}</div><div class="kpi-value">${v}</div><div class="kpi-sub">${esc(sub)}</div></div></div>`).join("");

    // per UPT
    const ups = new Map(); towers.forEach(t => { const u = ups.get(t.upt) || { n: 0, t: 0 }; u.n++; if (towerHasTemuan(t)) u.t++; ups.set(t.upt, u); });
    const upArr = [...ups.entries()].sort((a, b) => b[1].n - a[1].n), maxU = Math.max(1, ...upArr.map(x => x[1].n));
    $("#cuiUptChart").innerHTML = upArr.length ? `<ul class="bars cui-upt">${upArr.map(([u, x]) => `<li title="${esc(u)}: ${x.n} tower, ${x.t} dengan temuan"><span class="bl">${esc(title(u.replace(/^UPT /, "")))}</span>
      <span class="bt"><i style="width:${x.n / maxU * 100}%;background:var(--primary)"></i></span><b>${fmt(x.n)}</b><span class="cui-sub">${x.t} bertemuan (${pct(x.t, x.n)})</span></li>`).join("")}</ul>` : `<p class="dnil">Tidak ada data.</p>`;

    // progres per minggu (tanggal inspeksi tower)
    const wk = new Map();
    towers.forEach(t => { const d = new Date(t.tanggal + "T00:00:00"); const mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay() + 6) % 7)); const k = mon.toISOString().slice(0, 10); wk.set(k, (wk.get(k) || 0) + 1); });
    const wks = [...wk.entries()].sort(), maxW = Math.max(1, ...wks.map(x => x[1]));
    $("#cuiWeekChart").innerHTML = wks.length ? `<div class="cui-cols">${wks.map(([k, n]) => `<div class="cui-col" title="Minggu ${fmtD(k)}: ${n} tower">
      <span class="cui-colv">${n}</span><i style="height:${Math.max(n / maxW * 100, 2)}%"></i><small>${fmtD(k).slice(0, 5)}</small></div>`).join("")}</div>` : `<p class="dnil">Tidak ada data.</p>`;
  }

  /* ---------- Kondisi per item ---------- */
  function renderItems(rows, towers) {
    // urutan grid 2 kolom: Bottom | Top Fasa, lalu Mid | Earth Wire (tinggi kolom seimbang)
    $("#cuiItems").innerHTML = ["bottom", "top", "mid", "ew"].map(sec => [sec, SECTIONS[sec]]).map(([sec, name]) => {
      const its = ITEMS.filter(i => i.sec === sec);
      const unit = its[0].lvl === "klem" ? "klem" : "tower";
      return `<section class="cui-sec"><h4>${esc(name)} <small>dihitung per ${unit}</small></h4>${its.map(i => {
        const src = i.lvl === "klem" ? rows.map(r => r[i.k]) : towers.map(t => t.first[i.k]);
        const m = new Map(); let na = 0;
        src.forEach(v => { if (sev(v) === "na") na++; else m.set(v, (m.get(v) || 0) + 1); });
        const tot = src.length - na, vals = [...m.entries()].sort((a, b) => SEV[sev(b[0])].rank - SEV[sev(a[0])].rank || b[1] - a[1]);
        const bad = vals.filter(([v]) => sev(v) !== "ok").reduce((a, [, n]) => a + n, 0);
        return `<div class="cui-item"><div class="cui-item-h"><span>${esc(i.label)}</span><em>${bad ? `<b>${fmt(bad)}</b> temuan` : "tanpa temuan"} · ${fmt(tot)} ${unit}${na ? ` · ${fmt(na)} tidak diisi` : ""}</em></div>
          <div class="cui-stack">${vals.map(([v, n]) => { const s = sev(v), on = S.f.item && S.f.item.k === i.k && S.f.item.v === v;
            return `<button type="button" class="seg-${s}${on ? " on" : ""}" style="flex:${n}" data-k="${i.k}" data-v="${esc(v)}" title="${esc(v)}: ${fmt(n)} (${pct(n, tot)})" aria-label="${esc(i.label)} ${esc(v)} ${n}"></button>`; }).join("")}</div>
          <div class="cui-vals">${vals.filter(([v]) => sev(v) !== "ok").map(([v, n]) => `<button type="button" class="cui-val" data-k="${i.k}" data-v="${esc(v)}">${sevChip(sev(v), v)} ${fmt(n)}</button>`).join("")}</div></div>`;
      }).join("")}</section>`;
    }).join("");
    $("#cuiItemLegend").innerHTML = ["ok", "p3", "p2", "p1", "kritis", "lain"].map(s => `<span><i class="swatch" style="background:${SEV[s].color}"></i>${SEV[s].label}</span>`).join("");
  }

  /* ---------- Rekap per penghantar ---------- */
  function renderPeng(rows) {
    const m = new Map();
    towersOf(rows).forEach(t => {
      let p = m.get(t.penghantar); if (!p) m.set(t.penghantar, p = { peng: t.penghantar, upt: t.upt, tower: 0, klem: 0, tt: 0, rows: [], towers: [] });
      p.tower++; p.klem += t.rows.length; if (towerHasTemuan(t)) p.tt++; p.rows.push(...t.rows); p.towers.push(t);
    });
    const list = [...m.values()].map(p => { const c = sevCount(p.rows, p.towers); return { ...p, ...c, ratio: p.tt / p.tower, risk: c.kritis * 1000 + c.p1 * 100 + c.p2 }; });
    const { k, dir } = S.sort;
    list.sort((a, b) => (typeof a[k] === "string" ? a[k].localeCompare(b[k]) : a[k] - b[k]) * dir || b.tower - a.tower);
    const th = (key, label, num) => `<th class="${num ? "num " : ""}sortable${k === key ? " on" : ""}" data-sort="${key}">${label}${k === key ? (dir < 0 ? " ▾" : " ▴") : ""}</th>`;
    $("#cuiPengHead").innerHTML = `<tr>${th("peng", "Penghantar")}${th("upt", "UPT")}${th("tower", "Tower", 1)}${th("klem", "Klem", 1)}${th("ratio", "Tower bertemuan", 1)}${th("kritis", "Kritis", 1)}${th("p1", "P1", 1)}${th("p2", "P2", 1)}${th("p3", "P3", 1)}${th("lain", "Lain", 1)}</tr>`;
    $("#cuiPengRows").innerHTML = list.map(p => `<tr data-peng="${esc(p.peng)}" class="${S.f.peng === p.peng ? "sel" : ""}" tabindex="0"><td><b>${esc(p.peng)}</b></td><td>${esc(p.upt)}</td>
      <td class="num">${fmt(p.tower)}</td><td class="num">${fmt(p.klem)}</td><td class="num"><span class="cui-ratio"><i style="width:${p.ratio * 100}%"></i></span>${pct(p.tt, p.tower)}</td>
      <td class="num">${p.kritis ? sevChip("kritis", fmt(p.kritis)) : "—"}</td><td class="num">${p.p1 ? sevChip("p1", fmt(p.p1)) : "—"}</td>
      <td class="num">${fmt(p.p2)}</td><td class="num">${fmt(p.p3)}</td><td class="num">${fmt(p.lain)}</td></tr>`).join("");
    $("#cuiPengEmpty").hidden = list.length > 0;
  }

  /* ---------- Tabel data klem ---------- */
  const PER = 10;
  function renderTable(rows) {
    let list = S.f.only ? rows.filter(r => r._t.length) : rows;
    list = list.slice().sort((a, b) => b.tanggal.localeCompare(a.tanggal) || a.lokasi.localeCompare(b.lokasi) || a.clamp.localeCompare(b.clamp));
    const per = S.all ? Math.max(list.length, 1) : PER, pages = Math.max(1, Math.ceil(list.length / per));
    S.page = Math.min(Math.max(1, S.page), pages);
    const from = (S.page - 1) * per, view = list.slice(from, from + per);
    $("#cuiRows").innerHTML = view.map((r, i) => {
      const t = r._t, shown = t.slice(0, 3);
      return `<tr data-i="${r._i}" tabindex="0"><td class="num no">${from + i + 1}</td><td>${fmtD(r.tanggal)}</td>
        <td><b>${esc(r.lokasi)}</b><div class="muted sm">${esc(r.tipe && r.tipe !== "-" ? r.tipe : "Tipe tower tidak diisi")}</div></td>
        <td class="clamp">${esc(r.clamp)}</td><td>${esc(r.penghantar)}<div class="muted sm">${esc(r.upt)} · ${esc(r.ultg)}</div></td>
        <td>${r._worst === "ok" ? sevChip("ok") : sevChip(r._worst)}</td>
        <td class="temuan">${t.length ? shown.map(x => `<span class="cui-t">${esc(x.i.label)}: ${sevChip(x.s, x.v)}</span>`).join("") + (t.length > 3 ? `<span class="muted sm">+${t.length - 3} lainnya</span>` : "") : `<span class="muted sm">Tidak ada temuan</span>`}</td>
        <td class="act"><button type="button" class="btn ghost sm" data-i="${r._i}">Detail</button></td></tr>`;
    }).join("");
    $("#cuiEmpty").hidden = list.length > 0;
    $("#cuiCount").textContent = list.length ? `Menampilkan ${from + 1}–${from + view.length} dari ${fmt(list.length)} klem` : "Menampilkan 0 klem";
    const nums = [];
    for (let p = 1; p <= pages; p++) { if (p === 1 || p === pages || Math.abs(p - S.page) <= 1) nums.push(p); else if (nums[nums.length - 1] !== "…") nums.push("…"); }
    $("#cuiPager").innerHTML = pages <= 1 ? "" : `<button type="button" class="pg" data-p="${S.page - 1}" ${S.page === 1 ? "disabled" : ""} aria-label="Halaman sebelumnya">‹</button>` +
      nums.map(p => p === "…" ? `<span class="pg-gap">…</span>` : `<button type="button" class="pg${p === S.page ? " on" : ""}" data-p="${p}">${p}</button>`).join("") +
      `<button type="button" class="pg" data-p="${S.page + 1}" ${S.page === pages ? "disabled" : ""} aria-label="Halaman berikutnya">›</button>`;
    $("#cuiAll").hidden = list.length <= PER;
    $("#cuiAll").textContent = S.all ? `Tampilkan ${PER} per halaman` : `Tampilkan semua (${fmt(list.length)})`;
    const it = S.f.item;
    $("#cuiActive").innerHTML = [
      it && `<span class="chip-f">${esc(ITEM[it.k].label)} = ${esc(it.v)} <button type="button" data-clear="item" aria-label="Hapus filter item">×</button></span>`,
      S.f.peng && `<span class="chip-f">${esc(S.f.peng)} <button type="button" data-clear="peng" aria-label="Hapus filter penghantar">×</button></span>`
    ].filter(Boolean).join("");
  }

  function openDetail(i) {
    const r = S.rows[i]; if (!r) return;
    const same = S.rows.filter(x => x.lokasi === r.lokasi);
    $("#cuiDetTitle").textContent = r.lokasi;
    $("#cuiDetSub").innerHTML = `${esc(r.clamp)} · inspeksi ${fmtD(r.tanggal)} ${r._worst === "ok" ? sevChip("ok") : sevChip(r._worst)}`;
    const info = [["UPT", r.upt], ["ULTG", r.ultg], ["Gardu induk", r.gi], ["Penghantar", r.penghantar], ["Tipe tower", r.tipe], ["Keterangan", r.ket]];
    $("#cuiDetBody").innerHTML = `<dl class="dgrid">${info.map(([l, v]) => `<div><dt>${l}</dt><dd class="${v && v !== "-" ? "" : "nil"}">${esc(v && v !== "-" ? v : "—")}</dd></div>`).join("")}</dl>` +
      Object.entries(SECTIONS).map(([sec, name]) => `<section class="dsec"><h4>${esc(name)} <small>${sec === "top" ? "klem ini" : "seluruh tower"}</small></h4>
        <div class="cui-det-grid">${ITEMS.filter(x => x.sec === sec).map(x => { const s = sev(r[x.k]); return `<div><span>${esc(x.label)}</span>${s === "na" ? `<em class="muted">Tidak diisi</em>` : sevChip(s, r[x.k])}</div>`; }).join("")}</div></section>`).join("") +
      (same.length > 1 ? `<section class="dsec"><h4>Klem lain di tower ini <small>${same.length} klem</small></h4><div class="table-wrap flat"><table class="table"><thead><tr><th>Klem</th><th>Tanggal</th>${ITEMS.filter(x => x.sec === "top").map(x => `<th>${esc(x.label)}</th>`).join("")}</tr></thead><tbody>
        ${same.map(x => `<tr class="${x === r ? "sel" : ""}"><td>${esc(x.clamp)}</td><td>${fmtD(x.tanggal)}</td>${ITEMS.filter(it => it.sec === "top").map(it => { const s = sev(x[it.k]); return `<td>${s === "na" ? "—" : sevChip(s, x[it.k])}</td>`; }).join("")}</tr>`).join("")}</tbody></table></div></section>` : "");
    $("#cuiDetail").showModal();
  }

  function render(keepPage) {
    if (!keepPage) S.page = 1;
    renderFilters();
    const rowsNoItem = filtered(true), rows = filtered(false);
    const towersNoItem = towersOf(rowsNoItem);
    renderSummary(rowsNoItem, towersNoItem);
    renderItems(rowsNoItem, towersNoItem);
    renderPeng(rows);
    renderTable(rows);
  }

  /* ---------- Muat file export Jarvis baru (di browser) ---------- */
  const FIELDS = [["upt", "Upt"], ["ultg", "Ultg"], ["gi", "Gi"], ["penghantar", "Penghantar"], ["lokasi", "Lokasi"], ["clamp", "Clamp"], ["tanggal", "Tanggal Inspeksi"], ["tipe", "Tipe Tower"],
    ["halaman", "Halaman Tower"], ["acd", "Acd"], ["chimney", "Chimney"], ["stub", "Stub"], ["nomor", "Nomor Tower"], ["plat", "Plat Tanda Bahaya"], ["stepbolt", "Step Bolt"], ["row", "Right Of Way"],
    ["isolator", "Isolator"], ["aksCold", "Aksesoris Sisi Cold"], ["aksHot", "Aksesoris Sisi Hot"], ["konduktor", "Konduktor"], ["gap", "Gap Arching"],
    ["ewKond1", "Konduktor Earth Wire Line 1"], ["ewKond2", "Konduktor Earth Wire Line 2"], ["ewAks1", "Aksesoris Earth Wire Line 1"], ["ewAks2", "Aksesoris Earth Wire Line 2"], ["ket", "Keterangan"]];
  const MON = { JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06", JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12", MEI: "05", AGU: "08", AGS: "08", OKT: "10", DES: "12" };
  function isoDate(v) {
    const m = String(v).trim().toUpperCase().match(/^(\d{1,2})-([A-Z]{3})-(\d{2,4})$/);
    if (m && MON[m[2]]) return `${m[3].length === 2 ? "20" + m[3] : m[3]}-${MON[m[2]]}-${m[1].padStart(2, "0")}`;
    return String(v).trim();
  }
  function parseExport(text, name) {
    const doc = new DOMParser().parseFromString(text, "text/html");
    const trs = [...doc.querySelectorAll("tr")].map(tr => { const out = []; [...tr.children].forEach(td => { out.push(td.textContent.replace(/\s+/g, " ").trim()); for (let k = 1; k < (+td.getAttribute("colspan") || 1); k++) out.push(""); }); return out; });
    const hi = trs.findIndex(r => r.includes("Penghantar") && r.includes("Lokasi"));
    if (hi < 0) throw new Error("Format file tidak dikenali (kolom Penghantar/Lokasi tidak ditemukan). Gunakan file export CUI dari Jarvis.");
    const head = trs[hi], idx = {}; FIELDS.forEach(([k, h]) => { const j = head.indexOf(h); if (j >= 0) idx[k] = j; });
    const keys = FIELDS.map(f => f[0]).filter(k => k in idx), dict = {}, look = {}; keys.forEach(k => { dict[k] = []; look[k] = new Map(); });
    const rows = [];
    trs.slice(hi + 1).forEach(r => {
      if (r.length < head.length || !String(r[idx.lokasi] || "").trim()) return;
      rows.push(keys.map(k => { let v = String(r[idx[k]] || "").trim(); if (k === "tanggal") v = isoDate(v); if (!look[k].has(v)) { look[k].set(v, dict[k].length); dict[k].push(v); } return look[k].get(v); }));
    });
    if (!rows.length) throw new Error("Tidak ada baris data di file ini.");
    const ds = rows.map(r => dict.tanggal[r[keys.indexOf("tanggal")]]).sort();
    return { source: name, periode: [ds[0], ds[ds.length - 1]], keys, dict, rows };
  }
  async function onFile(file) {
    if (!file) return;
    const btn = $("#cuiUploadLbl"); btn.classList.add("disabled"); $("#cuiUploadTxt").textContent = "Membaca file…";
    try {
      const doc = parseExport(await file.text(), file.name);
      load(doc, true); render(); toast(`${fmt(doc.rows.length)} klem dimuat dari ${file.name}`);
    } catch (e) { toast(String(e.message || e)); }
    finally { btn.classList.remove("disabled"); $("#cuiUploadTxt").textContent = "Muat file export Jarvis"; }
  }

  /* ---------- Event ---------- */
  const setF = (k, v) => { S.f[k] = v; render(); };
  $("#cuiUpt").addEventListener("change", e => setF("upt", e.target.value));
  $("#cuiUltg").addEventListener("change", e => setF("ultg", e.target.value));
  $("#cuiPeng").addEventListener("change", e => setF("peng", e.target.value));
  $("#cuiFrom").addEventListener("change", e => setF("from", e.target.value));
  $("#cuiTo").addEventListener("change", e => setF("to", e.target.value));
  $("#cuiQ").addEventListener("input", e => { S.f.q = e.target.value; render(); });
  $("#cuiOnly").addEventListener("change", e => { S.f.only = e.target.checked; render(); });
  $("#cuiReset").addEventListener("click", () => { S.f = { upt: "", ultg: "", peng: "", from: "", to: "", q: "", only: false, item: null }; $("#cuiQ").value = ""; $("#cuiOnly").checked = false; render(); });
  $("#cuiItems").addEventListener("click", e => {
    const b = e.target.closest("[data-k]"); if (!b) return;
    const same = S.f.item && S.f.item.k === b.dataset.k && S.f.item.v === b.dataset.v;
    S.f.item = same ? null : { k: b.dataset.k, v: b.dataset.v }; render();
    if (!same) $("#cuiTableCard").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("#cuiPengHead").addEventListener("click", e => { const th = e.target.closest("[data-sort]"); if (!th) return; const k = th.dataset.sort; S.sort = { k, dir: S.sort.k === k ? -S.sort.dir : (k === "peng" || k === "upt" ? 1 : -1) }; renderPeng(filtered(false)); });
  $("#cuiPengRows").addEventListener("click", e => { const tr = e.target.closest("[data-peng]"); if (tr) setF("peng", S.f.peng === tr.dataset.peng ? "" : tr.dataset.peng); });
  $("#cuiRows").addEventListener("click", e => { const t = e.target.closest("[data-i]"); if (t) openDetail(+t.dataset.i); });
  $("#cuiRows").addEventListener("keydown", e => { const t = e.target.closest("tr[data-i]"); if (t && e.key === "Enter") openDetail(+t.dataset.i); });
  $("#cuiPager").addEventListener("click", e => { const b = e.target.closest("button[data-p]"); if (b && !b.disabled) { S.page = +b.dataset.p; renderTable(filtered(false)); } });
  $("#cuiAll").addEventListener("click", () => { S.all = !S.all; S.page = 1; renderTable(filtered(false)); });
  $("#cuiActive").addEventListener("click", e => { const b = e.target.closest("[data-clear]"); if (b) setF(b.dataset.clear, b.dataset.clear === "item" ? null : ""); });
  $("#cuiFile").addEventListener("change", e => { onFile(e.target.files[0]); e.target.value = ""; });
  $("#cuiDetail").addEventListener("click", e => { if (e.target === $("#cuiDetail")) $("#cuiDetail").close(); });

  if (window.CUI_JARVIS) { load(window.CUI_JARVIS, false); render(); }
})();
