/* =========================================================
   Dashboard FASHAR UIT JBM — data (mock) & rendering
   ========================================================= */
const $ = (s, r = document) => r.querySelector(s);
const fmt = n => n.toLocaleString("id-ID");
const fmt1 = n => n.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const sum = a => a.reduce((x, y) => x + y, 0);
const title = s => s.charAt(0) + s.slice(1).toLowerCase();

const UNITS = ["SURABAYA", "GRESIK", "MALANG", "MADIUN", "PROBOLINGGO", "BALI"];
const CATS = ["ISOLATOR", "ACCESSORIES COLD", "ACCESSORIES HOT", "ACCESSORIES GSW"];
const C = { gi: "var(--gi)", jar: "var(--jar)", p1: "var(--p1)", p2: "var(--p2)", p3: "var(--p3)", ok: "var(--ok)" };
const TARGET = 115, GAUGE_MAX = 150;

/* ---------- Icons ---------- */
const ICON = {
  location: '<path d="M12 21s-7-5.2-7-11a7 7 0 1 1 14 0c0 5.8-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  doc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  transformer: '<rect x="5" y="7" width="14" height="10" rx="2"/><path d="M9 7V4M15 7V4M9 20v-3M15 20v-3"/>',
  rotate: '<path d="M3 12a9 9 0 0 1 15.5-6.3L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.3L3 16M3 21v-5h5"/>',
  gear: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  tower: '<path d="M12 3v18M5 8l7-5 7 5M7 13h10M5 21h14"/>',
  out: '<path d="M14 4h6v6M20 4l-8 8M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>',
  x: '<circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/>',
  truck: '<rect x="3" y="9" width="13" height="8" rx="1.5"/><path d="M16 12h3l2 3v2h-5"/><circle cx="7" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5 2.5-2.5Z"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
  pulse: '<path d="M3 12h4l2-5 4 10 2-5h6"/>'
};
const icon = (k, cls = "ic") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICON[k]}</svg>`;

/* =========================================================
   DATA (statis / mock — siap diganti data Google Sheets)
   ========================================================= */
const DATA = {
  optimTotal: { gi: 120.8, jar: 115.3 },
  bars: {
    gi: [
      ["Preventive Action", [100, 94, 90, 87, 92, 98]],
      ["Corrective Action", [96, 88, 72, 95, 91, 70]],
      ["Program Keandalan", [100, 83, 104, 88, 92, 90]]
    ],
    jar: [
      ["Preventive Action", [105, 96, 92, 78, 87, 95]],
      ["Corrective Action", [95, 120, 70, 84, 46, 100]],
      ["Program Keandalan", [98, 92, 99, 101, 75, 90]]
    ]
  },
  cert: [["Level 2 JAR", 48, 78], ["Level 2 GI", 50, 82], ["Level 3 JAR", 47, 79], ["Level 3 GI", 40, 66], ["Level 4", 25, 42], ["Level 5", 6, 15]],
  optimUpt: [
    ["SURABAYA", 108.7, 122.8], ["MADIUN", 108.7, 114.2], ["GRESIK", 116.5, 129.5],
    ["PROBOLINGGO", 124.1, 96.8], ["MALANG", 126.0, 112.0], ["BALI", 122.1, 116.8]
  ],
  realisasi: [
    ["Preventive Action", 755, 2533, "shield"],
    ["Corrective Action", 270, 227, "wrench"],
    ["Program Keandalan Transmisi", 492, 1094, "pulse"]
  ],
  healthJar: [[207, 807, 16059], [222, 1098, 8049], [471, 1976, 10563], [415, 1027, 4229]],
  healthGI: [[47, 437, 2502], [9, 107, 1675], [97, 462, 1914], [81, 386, 1846]],
  mapErs: [
    { x: 110, y: 128, c: "var(--p2)", l: "Tower Emergency" },
    { x: 280, y: 140, c: "var(--p3)", l: "Trafo Mobile" },
    { x: 370, y: 146, c: "var(--p1)", l: "DC Mobile" },
    { x: 420, y: 150, c: "var(--violet)", l: "Crane 22 Ton" }
  ],
  towerKpi: [
    ["Total Aset Tower ERS", 18, "tower", "primary"],
    ["ERS Dipinjam", 9, "out", "p1"],
    ["Standby Lengkap", 3, "check", "ok"],
    ["Standby Tidak Lengkap", 6, "alert", "p2"]
  ],
  mapTower: [
    { x: 110, y: 128, c: "var(--ok)", l: "Standby lengkap" },
    { x: 285, y: 142, c: "var(--p2)", l: "Standby tidak lengkap" },
    { x: 390, y: 148, c: "var(--p1)", l: "Dipinjam" }
  ],
  materials: {
    "LINDSEY": [["Post Insulator Support", 3], ["Tower Gimbal", 8], ["4-Way Guy Plate", 19], ["Guy Plate", 17], ["Overhead Ground Wire Bracket", 3], ["Anchor Bracket (MOCK)", 12], ["Cross Arm Support (MOCK)", 7], ["Insulator Clamp (MOCK)", 21], ["Guy Wire Fitting (MOCK)", 14], ["Structure Connector (MOCK)", 9]],
    "TOWER SOLUTION": [["Transfer Rod", 324], ["Tower Section", 72], ["Base Pivot", 15], ["Bolt Assembly", 498], ["Universal Attachment", 30], ["Extension Mast (MOCK)", 18], ["Support Bracket (MOCK)", 42], ["Pivot Connector (MOCK)", 24], ["Guy Assembly (MOCK)", 36], ["Foundation Plate (MOCK)", 11]],
    "SBB": [["Mast Section", 22], ["Universal Bracket", 27], ["Line Post Insulator Bracket", 6], ["Bolt 3/4", 180], ["Hex Nut 3/4", 374], ["Diagonal Brace (MOCK)", 34], ["Base Plate (MOCK)", 16], ["Lock Washer 3/4 (MOCK)", 210], ["Connecting Plate (MOCK)", 28], ["Support Clamp (MOCK)", 13]]
  },
  trafoKpi: [
    ["Total Aset Trafo Mobile", 8, "truck", "primary"],
    ["Beroperasi", 4, "check", "ok"],
    ["Dipinjam", 2, "out", "p2"],
    ["Rusak", 2, "x", "p1"]
  ],
  trafoUpt: [
    { title: "UPT Malang", x: 250, y: 150, items: ["GI 150 kV Ngoro", "Perkuatan GI Ngoro (Pertumbuhan beban)", "CG Pauwels - 30 MVA (Berbeban)", "Extension trafo AI 2024 rencana onsite 2027", "Trafo, MTU, Kubikel, Kontrol"] },
    { title: "UPT Probolinggo", x: 385, y: 140, items: ["GISTET 500 kV Paiton", "Perkuatan trafo TFT karena hanya 1 bay trafo", "CG Pauwels - 30 MVA (Standby)", "Rencana perbaikan 2026", "Trafo, MTU, Kubikel, Kontrol"] },
    { title: "UPT Bali", x: 535, y: 165, items: ["GI 150 kV Gianyar", "Perkuatan GI Ngoro (Pertumbuhan beban)", "CG Pauwels - 30 MVA (Berbeban)", "Belum ada ekstension trafo karena terkendala pembebasan lahan", "Trafo, MTU, Kubikel"] },
    { title: "UPT Madiun", x: 150, y: 172, items: ["GI 150 kV New Tulungagung", "Perkuatan GI New Tul (Pertumbuhan beban)", "CG Pauwels - 30 MVA (Berbeban)", "Hanya 1 trafo", "Trafo, MTU, Kubikel, Kontrol"] }
  ],
  trafoLoan: [
    { title: "IKN", status: "Dipinjam", items: ["IKN", "Pendukung Pembangunan IKN", "CG Pauwels - 30 MVA", "-", "Trafo, MTU, Kubikel, Kontrol"] },
    { title: "GI 150 kV Garuda Sakti", status: "Dipinjam", items: ["GI 150 kV Garuda Sakti", "Program High Quality Growth 2024", "Fuji Electric - 20 MVA", "-", "Trafo, MTU, Kubikel"] },
    { title: "UPT Gresik", x: 236, y: 118, status: "Rusak", items: ["GIS 150 kV Tandes", "Kondisi Tidak Layak Operasi / Rusak Berat", "ABB (Rusak)", "Rencana ATTB", "MTU, Kubikel"] },
    { title: "UPT Surabaya", x: 268, y: 124, status: "Rusak", items: ["GI 150 kV Kalisari", "Hasil uji buruk pada belitan HV to Ground, OLTC rusak dan hasil uji winding buruk", "ABB - 30 MVA (Rusak)", "Rencana ATTB", "Trafo, MTU, Kubikel"] }
  ]
};

/* =========================================================
   COMPONENTS
   ========================================================= */
function gaugeSvg(value, color, size = "lg") {
  const r = 80, cx = 100, cy = 100;
  const pct = Math.min(value / GAUGE_MAX, 1) * 100;
  const a = Math.PI * (1 - TARGET / GAUGE_MAX);
  const p = (rr) => `${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy - rr * Math.sin(a)).toFixed(1)}`;
  const arc = `M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  return `<svg class="gauge gauge-${size}" viewBox="0 0 200 122" role="img" aria-label="${fmt1(value)} persen dari target ${TARGET} persen">
    <path d="${arc}" class="g-track" pathLength="100"/>
    <path d="${arc}" class="g-fill" pathLength="100" style="stroke:${color};stroke-dashoffset:${100 - pct}"/>
    <path d="M${p(r - 13)} L${p(r + 13)}" class="g-target"/>
    <text x="100" y="92" class="g-value">${fmt1(value)}<tspan class="g-unit" dx="2">%</tspan></text>
    <text x="${cx - r}" y="120" class="g-scale">0</text>
    <text x="${cx + r}" y="120" class="g-scale">${GAUGE_MAX}</text>
  </svg>`;
}

function targetBadge(v) {
  const d = v - TARGET;
  return d >= 0
    ? `<span class="badge ok">${icon("check", "ic xs")}Tercapai · +${fmt1(d)}</span>`
    : `<span class="badge bad">${icon("alert", "ic xs")}Di bawah target · ${fmt1(d)}</span>`;
}

function barList(labels, values, color, max = 120) {
  return `<ul class="bars">${labels.map((l, i) => `
    <li><span class="bl">${l}</span>
      <span class="bt"><i style="width:${Math.min(values[i] / max * 100, 100)}%;background:${color}"></i></span>
      <b>${values[i]}</b></li>`).join("")}</ul>`;
}

function donut(vals) {
  const total = sum(vals), colors = [C.p1, C.p2, C.p3];
  let acc = 0;
  const segs = vals.map((v, i) => {
    const p = v / total * 100, gap = p > 1.5 ? 0.8 : 0;
    const s = `<circle cx="50" cy="50" r="40" pathLength="100" style="stroke:${colors[i]};stroke-dasharray:${Math.max(p - gap, 0.4)} ${100 - p + gap};stroke-dashoffset:${-acc}"/>`;
    acc += p; return s;
  }).join("");
  return `<svg class="donut" viewBox="0 0 100 100" role="img" aria-label="Total ${fmt(total)} temuan">
    <circle cx="50" cy="50" r="40" class="d-track"/>${segs}
    <text x="50" y="49" class="d-total">${fmt(total)}</text><text x="50" y="61" class="d-cap">temuan</text></svg>`;
}

function mapSvg(pins, legend = true) {
  // legend: true = otomatis dari pin, string = HTML legend kustom, false = tanpa legend
  return `<div class="map"><svg viewBox="0 0 600 240" role="img" aria-label="Peta skematis Jawa Timur dan Bali">
    <defs><pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" class="m-dot"/></pattern></defs>
    <rect x="-1200" y="-600" width="3000" height="1440" class="m-sea"/><rect x="-1200" y="-600" width="3000" height="1440" fill="url(#dots)"/>
    <path class="m-land" d="M16 128C40 104 92 96 150 104C200 111 240 98 296 104C346 110 392 116 436 130C462 140 466 178 440 190C392 206 336 200 282 196C220 192 162 198 108 192C62 188 26 178 14 160C8 150 8 138 16 128Z"/>
    <path class="m-land" d="M292 82C326 66 384 64 420 72C434 80 428 96 400 100C364 106 326 104 300 98C288 94 284 88 292 82Z"/>
    <path class="m-land" d="M478 146C500 132 538 134 566 146C580 156 572 176 548 182C528 196 506 192 494 176C480 170 470 158 478 146Z"/>
    <text x="230" y="226" class="m-label">JAWA TIMUR</text><text x="358" y="56" class="m-label">MADURA</text><text x="524" y="214" class="m-label">BALI</text>
    ${pins.map(p => `<g class="pin" tabindex="0"><title>${p.l}</title><circle cx="${p.x}" cy="${p.y}" r="14" style="fill:${p.c}" class="pin-halo"/><circle cx="${p.x}" cy="${p.y}" r="6.5" style="fill:${p.c}" class="pin-dot"/></g>`).join("")}
  </svg></div>
  ${typeof legend === "string" ? legend : legend ? `<div class="legend">${[...new Map(pins.map(p => [p.l, p.c])).entries()].slice(0, 5).map(([l, c]) => `<span><i class="swatch" style="background:${c}"></i>${l}</span>`).join("")}</div>` : ""}`;
}

function kpi([label, value, ic, tone]) {
  return `<div class="card kpi tone-${tone}"><div class="kpi-icon">${icon(ic)}</div><div><div class="kpi-label">${label}</div><div class="kpi-value">${fmt(value)}</div></div></div>`;
}

/* =========================================================
   RENDER — Kinerja
   ========================================================= */
[["gaugeGI", "Optimalisasi PDKB Gardu Induk", DATA.optimTotal.gi, C.gi], ["gaugeJAR", "Optimalisasi PDKB Jaringan", DATA.optimTotal.jar, C.jar]]
  .forEach(([id, t, v, c]) => {
    $("#" + id).innerHTML = `<div class="card-head"><div><h3>${t}</h3><p>Capaian UIT JBM tahun berjalan</p></div></div>
      <div class="card-body gauge-wrap">${gaugeSvg(v, c)}</div>
      <div class="card-foot"><span class="muted">Target ${TARGET}%</span>${targetBadge(v)}</div>`;
  });
$("#mapKinerja").innerHTML = mapSvg(DATA.mapErs);

const uptLabels = UNITS.map(title);
["gi", "jar"].forEach(k => {
  $(k === "gi" ? "#barsGI" : "#barsJAR").innerHTML = DATA.bars[k].map(([t, vals]) => {
    const avg = sum(vals) / vals.length;
    return `<div class="card"><div class="card-head"><div><h3>${t}</h3><p>Rata-rata <b>${fmt1(avg)}</b></p></div></div>
      <div class="card-body">${barList(uptLabels, vals, C[k])}</div></div>`;
  }).join("");
});

$("#cert").innerHTML = `<div class="legend"><span><i class="swatch" style="background:var(--ok)"></i>Aktif</span><span><i class="swatch" style="background:var(--p1)"></i>Kadaluarsa</span></div>
  <ul class="bars stacked cert-bars">${DATA.cert.map(([l, aktif, pct]) => {
    const total = Math.round(aktif / pct * 100), exp = total - aktif;
    return `<li><span class="bl">${l}</span><span class="bt"><i style="width:${pct}%;background:var(--ok)"></i><i style="width:${100 - pct}%;background:var(--p1)"></i></span>
      <b>${aktif}<small> / ${total}</small></b><span class="exp">${exp} kadaluarsa</span></li>`;
  }).join("")}</ul>`;

/* ---------- Optimalisasi ---------- */
$("#realisasi").innerHTML = DATA.realisasi.map(([t, gi, jar, ic]) => `
  <div class="card stat">
    <div class="stat-head"><span class="kpi-icon sm">${icon(ic)}</span><h3>Realisasi ${t}</h3></div>
    <div class="stat-split">
      <div><span class="stat-l"><i class="swatch gi"></i>Gardu Induk</span><span class="stat-n">${fmt(gi)}</span></div>
      <div><span class="stat-l"><i class="swatch jar"></i>Jaringan</span><span class="stat-n">${fmt(jar)}</span></div>
    </div>
    <div class="split-bar"><i style="flex:${gi};background:var(--gi)"></i><i style="flex:${jar};background:var(--jar)"></i></div>
  </div>`).join("");

$("#optimGrid").innerHTML = DATA.optimUpt.map(([u, gi, jar]) => {
  const ok = gi >= TARGET && jar >= TARGET;
  return `<div class="card">
    <div class="card-head"><div><h3>UPT ${title(u)}</h3></div>${ok ? '<span class="badge ok">Semua tercapai</span>' : '<span class="badge warn">Perlu perhatian</span>'}</div>
    <div class="card-body optim-pair">
      <div>${gaugeSvg(gi, C.gi, "sm")}<div class="optim-l"><i class="swatch gi"></i>GI ${gi < TARGET ? '<em class="neg">' + fmt1(gi - TARGET) + '</em>' : ''}</div></div>
      <div>${gaugeSvg(jar, C.jar, "sm")}<div class="optim-l"><i class="swatch jar"></i>Jaringan ${jar < TARGET ? '<em class="neg">' + fmt1(jar - TARGET) + '</em>' : ''}</div></div>
    </div></div>`;
}).join("");

/* ---------- Health Index ---------- */
function healthCards(target, rows) {
  $(target).innerHTML = CATS.map((c, i) => {
    const v = rows[i], t = sum(v);
    return `<div class="card health-card"><div class="card-head"><div><h3>${title(c)}</h3></div></div>
      <div class="card-body">${donut(v)}
        <ul class="plist">${["P1", "P2", "P3"].map((p, j) => `<li><i class="swatch p${j + 1}"></i><span>${p}</span><b>${fmt(v[j])}</b><em>${(v[j] / t * 100).toFixed(1).replace(".", ",")}%</em></li>`).join("")}</ul>
      </div></div>`;
  }).join("");
}
healthCards("#healthJar", DATA.healthJar);
healthCards("#healthGI", DATA.healthGI);

/* ---------- Asesmen JAR / GI (mock per UPT) ---------- */
function assessData(scale) {
  return UNITS.map((u, i) => ({
    upt: u,
    rows: CATS.map((c, j) => {
      const total = Math.round([120, 620, 1500, 2800][(i + j) % 4] * scale);
      const p1 = Math.round(total * (0.03 + ((i + j * 2) % 5) * 0.012));
      const p2 = Math.round(total * (0.12 + ((i * 3 + j) % 4) * 0.03));
      return { cat: c, p: [p1, p2, total - p1 - p2] };
    })
  }));
}
function renderAssess(grid, summary, data) {
  const tot = [0, 1, 2].map(k => sum(data.flatMap(d => d.rows.map(r => r.p[k]))));
  const names = ["Prioritas 1 (P1)", "Prioritas 2 (P2)", "Prioritas 3 (P3)"];
  $(summary).innerHTML = tot.map((t, k) => `<div class="card kpi tone-p${k + 1}"><div class="kpi-icon">${icon(["alert", "pulse", "check"][k])}</div><div><div class="kpi-label">Total ${names[k]}</div><div class="kpi-value">${fmt(t)}</div></div><span class="kpi-share">${(t / sum(tot) * 100).toFixed(1).replace(".", ",")}%</span></div>`).join("");
  $(grid).innerHTML = data.map(d => {
    const max = Math.max(...d.rows.map(r => sum(r.p)));
    return `<div class="card"><div class="card-head"><div><h3>UPT ${title(d.upt)}</h3><p>${fmt(sum(d.rows.map(r => r.p[0])))} temuan P1</p></div></div>
      <div class="card-body"><ul class="bars stacked">${d.rows.map(r => {
        const t = sum(r.p), w = t / max * 100;
        return `<li title="P1 ${fmt(r.p[0])} · P2 ${fmt(r.p[1])} · P3 ${fmt(r.p[2])}"><span class="bl">${title(r.cat)}</span>
          <span class="bt"><span class="seg" style="width:${w}%">${r.p.map((v, k) => `<i style="flex:${v};background:var(--p${k + 1})"></i>`).join("")}</span></span><b>${fmt(t)}</b></li>`;
      }).join("")}</ul></div></div>`;
  }).join("");
}
renderAssess("#jarGrid", "#jarSummary", assessData(1));
renderAssess("#giGrid", "#giSummary", assessData(0.55));

/* ---------- Tower Emergency ---------- */
$("#towerKpi").innerHTML = DATA.towerKpi.map(kpi).join("");
$("#mapTower").innerHTML = mapSvg(DATA.mapTower);
$("#materialTables").innerHTML = Object.entries(DATA.materials).map(([k, rows], idx) => `
  <div class="card material-card" data-material-card="${idx}">
    <div class="card-head"><div><h3>${k}</h3><p><span class="count">${rows.length}</span> jenis material · ${fmt(sum(rows.map(r => r[1])))} unit</p></div></div>
    <div class="search">${icon("search")}<input type="search" placeholder="Cari material…" aria-label="Cari material ${k}" oninput="filterMaterialTable(${idx}, this.value)"></div>
    <div class="table-wrap"><table class="table">
      <thead><tr><th>Material</th><th class="num">Jumlah</th></tr></thead>
      <tbody>${rows.map(r => `<tr data-material-row><td>${r[0]}</td><td class="num">${fmt(r[1])}</td></tr>`).join("")}</tbody>
    </table><div class="empty" hidden>Material tidak ditemukan.</div></div>
  </div>`).join("");

function filterMaterialTable(cardIndex, query) {
  const card = $(`[data-material-card="${cardIndex}"]`);
  if (!card) return;
  const q = (query || "").trim().toLowerCase();
  let visible = 0;
  card.querySelectorAll("[data-material-row]").forEach(row => {
    const match = row.textContent.toLowerCase().includes(q);
    row.hidden = !match; if (match) visible++;
  });
  card.querySelector(".empty").hidden = visible > 0;
  card.querySelector(".count").textContent = visible;
}

/* ---------- Trafo Mobile ---------- */
$("#trafoKpi").innerHTML = DATA.trafoKpi.map(kpi).join("");

const FIELD = [["location", "Lokasi"], ["doc", "Keterangan"], ["transformer", "Spesifikasi"], ["rotate", "Rencana"], ["gear", "Kelengkapan"]];
function trafoStatus(card) {
  if (card.status) return card.status;
  const spec = card.items[2];
  return /Rusak/i.test(spec) ? "Rusak" : /Standby/i.test(spec) ? "Standby" : "Berbeban";
}
const STATUS_TONE = { Berbeban: "ok", Standby: "info", Dipinjam: "warn", Rusak: "bad" };
function renderTrafoCard(card) {
  const st = trafoStatus(card);
  return `<div class="card trafo-card st-${STATUS_TONE[st]}">
    <div class="card-head"><div><h3>${card.title}</h3></div><span class="badge ${STATUS_TONE[st]}">${st}</span></div>
    <dl class="info-list">${card.items.map((t, i) => `<div class="info-row">${icon(FIELD[i][0])}<dt>${FIELD[i][1]}</dt><dd>${t}</dd></div>`).join("")}</dl>
  </div>`;
}
/* Peta: warna pin = kondisi trafo (sama dengan badge kartu) */
const STATUS_COLOR = { Berbeban: "var(--ok)", Standby: "var(--primary)", Dipinjam: "var(--p2)", Rusak: "var(--p1)" };
const trafoAll = [...DATA.trafoUpt, ...DATA.trafoLoan].map(c => ({ ...c, st: trafoStatus(c) }));
const trafoPins = trafoAll.filter(c => c.x != null).map(c => ({ x: c.x, y: c.y, c: STATUS_COLOR[c.st], l: `${c.items[0]} · ${c.st}` }));
const trafoLegend = `<div class="legend">${Object.entries(STATUS_COLOR).map(([st, col]) => {
  const n = trafoAll.filter(c => c.st === st).length, off = trafoAll.filter(c => c.st === st && c.x == null).length;
  return `<span><i class="swatch" style="background:${col}"></i>${st} (${n})${off ? `<small class="legend-note">· di luar UIT JBM</small>` : ""}</span>`;
}).join("")}</div>`;
$("#mapTrafo").innerHTML = mapSvg(trafoPins, trafoLegend);
$("#trafoUptCards").innerHTML = DATA.trafoUpt.map(renderTrafoCard).join("");
$("#trafoLoanCards").innerHTML = DATA.trafoLoan.map(renderTrafoCard).join("");

function copyLink(btn) {
  const url = "https://bit.ly/trafo-mobile-uit-jbm";
  const done = () => toast("Tautan disalin ke clipboard");
  if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, () => toast(url));
  else toast(url);
}
let toastTimer;
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

/* =========================================================
   DATABASE TRAFO MOBILE
   Sumber: Google Sheets (via Apps Script, bila config.js diisi)
           atau data statis data/trafo-mobile-db.js
   ========================================================= */
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const TDB_STATUS = {
  "OPERASI": { label: "Operasi", tone: "ok", color: "var(--ok)" },
  "STANDBY": { label: "Standby", tone: "info", color: "var(--primary)" },
  "RUSAK": { label: "Rusak", tone: "bad", color: "var(--p1)" },
  "BELUM DIPASTIKAN": { label: "Belum dipastikan", tone: "muted", color: "var(--text-3)" }
};
const tdbSt = s => TDB_STATUS[s] || TDB_STATUS["BELUM DIPASTIKAN"];
const tdbName = k => title(k.replace(/^MOBILE\s+/i, "")).replace(/\(([^)]*)\)/, (m, x) => "(" + x.toLowerCase() + ")");
const tdbKey = r => (r.gi || "-").replace(/\s+/g, "").toUpperCase();
const tdbOutside = r => /^UIP3B/i.test(r.upt || "");
const TDB_ANOM = ["Open", "In Progress", "Close"]; // harus sama dengan validasi data kolom N di sheet 2. TRAFO MOBILE
const anomTone = s => /open/i.test(s || "") ? "bad" : /progress|proses/i.test(s || "") ? "warn" : /close|selesai/i.test(s || "") ? "ok" : "muted";
const TDB_API = (window.FASHAR_CONFIG && window.FASHAR_CONFIG.trafoDbApi || "").trim();
const TDB = {
  rows: (window.TRAFO_DB && window.TRAFO_DB.rows) || [],
  source: (window.TRAFO_DB && window.TRAFO_DB.source) || "",
  live: false, editing: null
};
const TDB_FIELDS = [
  ["komponen", "Komponen", "text", { required: true, list: "tdbKomponenList", wide: true }],
  ["status", "Status", "select"],
  ["no", "No", "text", { inputmode: "numeric" }],
  ["sn", "Serial number", "text"],
  ["merk", "Merk", "text", { list: "tdbMerkList" }],
  ["kv", "Tegangan (kV)", "text", { placeholder: "mis. 150/20" }],
  ["mva", "Kapasitas (MVA)", "text", { inputmode: "decimal" }],
  ["tahun", "Tahun buatan", "text", { inputmode: "numeric", pattern: "\\d{4}", placeholder: "YYYY" }],
  ["lokasi", "Lokasi penempatan", "loc"],
  ["identitas", "Identitas", "text"],
  ["namaAset", "Nama aset", "aset"],
  ["keterangan", "Keterangan", "textarea", { wide: true }],
  ["anomali", "Uraian anomali", "textarea", { wide: true }],
  ["tindakLanjut", "Tindak lanjut & mitigasi", "textarea", { wide: true }],
  ["statusAnomali", "Status anomali", "select-anom"]
];

/* ---------- Daftar UPT & GI (data/gi-uit-jbm.js) ---------- */
const GI_LIST = window.GI_UIT_JBM || [];
const UPT_LIST = [...new Set(GI_LIST.map(x => x.upt))].sort();
const UPT_ALIAS = { PBL: "PROBOLINGGO", SBY: "SURABAYA", MLG: "MALANG", MDN: "MADIUN", GRS: "GRESIK" };
function uptCanon(v) {
  if (!v) return "";
  let t = String(v).toUpperCase().replace(/\s+/g, " ").trim();
  const m = t.match(/^UPT\s+(\w+)$/); if (m && UPT_ALIAS[m[1]]) t = "UPT " + UPT_ALIAS[m[1]];
  return UPT_LIST.includes(t) ? t : "";
}
function giParts(v) {
  const t = String(v || "").toUpperCase().replace(/\s+/g, " ").trim();
  const m = t.match(/^(GISTET|GITET|GIS|GI)\b/);
  const cls = !m ? "" : /T/.test(m[1].slice(2)) ? "TET" : m[1];
  const name = t.replace(/^(GISTET|GITET|GIS|GI)\b/, "").replace(/\d+\s*KV/g, "").replace(/\([^)]*\)/g, "").replace(/[^A-Z0-9]/g, "");
  return { cls, name };
}
/* cari nama GI resmi dari daftar; prioritas: nama sama + jenis sama (GI/GIS/GITET) */
function giCanon(v, upt) {
  if (!v) return "";
  const p = giParts(v), pool = GI_LIST.filter(x => !upt || x.upt === upt);
  const same = pool.filter(x => giParts(x.gi).name === p.name);
  if (!same.length) return "";
  return (same.find(x => giParts(x.gi).cls === p.cls) || same[0]).gi;
}
function giSame(a, b) { const x = giParts(a), y = giParts(b); return x.name === y.name && (x.cls === y.cls || !x.cls || !y.cls); }

function renderTrafoDb() {
  if (!$("#page-trafodb")) return;
  const rows = TDB.rows;

  const groups = new Map();
  rows.forEach(r => {
    const k = tdbKey(r);
    if (!groups.has(k)) groups.set(k, { key: k, names: {}, upt: r.upt, rows: [] });
    const g = groups.get(k); g.rows.push(r); g.names[r.gi] = (g.names[r.gi] || 0) + 1;
  });
  groups.forEach(g => g.name = Object.entries(g.names).sort((a, b) => b[1] - a[1])[0][0]);
  const locs = [...groups.values()];

  const cnt = s => rows.filter(r => r.status === s).length;
  const outside = locs.filter(g => tdbOutside(g.rows[0])).length;
  $("#tdbKpi").innerHTML = [
    ["Total Komponen", rows.length, "transformer", "primary", `${locs.length} lokasi · ${outside} di luar UIT JBM`],
    ["Operasi", cnt("OPERASI"), "check", "ok"],
    ["Standby", cnt("STANDBY"), "pulse", "p3"],
    ["Rusak", cnt("RUSAK"), "x", "p1", cnt("BELUM DIPASTIKAN") ? `${cnt("BELUM DIPASTIKAN")} komponen belum dipastikan` : ""]
  ].map(([l, v, ic, tone, sub]) => `<div class="card kpi tone-${tone}"><div class="kpi-icon">${icon(ic)}</div><div><div class="kpi-label">${l}</div><div class="kpi-value">${fmt(v)}</div>${sub ? `<div class="kpi-sub">${esc(sub)}</div>` : ""}</div></div>`).join("");

  $("#tdbLokasi").innerHTML = locs.map(g => {
    const out = tdbOutside(g.rows[0]);
    const counts = Object.keys(TDB_STATUS).map(s => [s, g.rows.filter(r => r.status === s).length]).filter(x => x[1]);
    const ket = [...new Set(g.rows.map(r => r.keterangan).filter(Boolean))];
    const asal = [...new Set(g.rows.map(r => r.namaAset).filter(Boolean))];
    return `<div class="card tdb-loc">
      <div class="card-head"><div><h3>${esc(g.name)}</h3><p>${esc(g.upt)}</p></div>${out ? '<span class="badge warn">Di luar UIT JBM</span>' : ""}</div>
      <div class="tdb-chips">${counts.map(([s, n]) => `<span class="badge ${tdbSt(s).tone}">${n} ${tdbSt(s).label}</span>`).join("")}</div>
      <ul class="tdb-parts">${g.rows.map(r => `<li>
        <i class="dot" style="background:${tdbSt(r.status).color}" title="${tdbSt(r.status).label}"></i>
        <div><b>${esc(tdbName(r.komponen))}</b><span>${[r.merk, r.kv && r.kv + " kV", r.mva && r.mva + " MVA", r.tahun].filter(Boolean).map(esc).join(" · ") || "Data belum lengkap"}</span></div>
        <code>${r.sn ? esc(r.sn) : "—"}</code></li>`).join("")}</ul>
      ${ket.length || asal.length ? `<div class="card-foot tdb-note">${ket.length ? `<p>${ket.map(esc).join("<br>").replace(/\n/g, "<br>")}</p>` : ""}${asal.length ? `<p class="muted">Nama aset: ${asal.map(esc).join(", ")}</p>` : ""}</div>` : ""}
    </div>`;
  }).join("");

  const an = rows.filter(r => r.anomali);
  $("#tdbAnomali").innerHTML = an.length ? an.map(r => `<div class="card tdb-anom">
    <div class="card-head"><div><h3>${esc(tdbName(r.komponen))}</h3><p>${esc(r.gi)} · ${esc(r.upt)}</p></div><span class="badge ${r.statusAnomali ? anomTone(r.statusAnomali) : "warn"}">${esc(r.statusAnomali || "Belum ada status")}</span></div>
    <div class="card-body"><div class="tdb-field"><span>Uraian anomali</span><p>${esc(r.anomali)}</p></div>
      ${r.tindakLanjut ? `<details class="tdb-field"><summary>Tindak lanjut &amp; mitigasi</summary><p>${esc(r.tindakLanjut)}</p></details>` : ""}</div>
  </div>`).join("") : `<div class="card"><div class="card-body empty">Tidak ada anomali tercatat.</div></div>`;

  $("#tdbSource").innerHTML = `Sumber: ${esc(TDB.source)} · ${rows.length} baris · ${TDB.live
    ? '<b class="src-live">● Live dari Google Sheets</b>'
    : '<b class="src-static">● Data statis (cadangan)</b>'}`;
  const loc = $("#tdbLoc").value;
  $("#tdbLoc").innerHTML = `<option value="">Semua lokasi</option>` + locs.map(g => `<option value="${esc(g.key)}">${esc(g.name)}</option>`).join("");
  if (locs.some(g => g.key === loc)) $("#tdbLoc").value = loc;
  const st = $("#tdbStatus .on")?.dataset.v || "";
  const stOpts = [["", "Semua", rows.length], ...Object.keys(TDB_STATUS).map(s => [s, tdbSt(s).label, cnt(s)]).filter(x => x[2])];
  const curSt = stOpts.some(o => o[0] === st) ? st : "";
  $("#tdbStatus").innerHTML = stOpts.map(([v, l, n]) => `<button type="button" data-v="${esc(v)}" class="${v === curSt ? "on" : ""}" aria-pressed="${v === curSt}">${l} <small>${n}</small></button>`).join("");

  $("#tdbRows").innerHTML = rows.map((r, i) => `<tr data-key="${esc(tdbKey(r))}" data-st="${esc(r.status)}">
    <td class="muted">${esc(r.no || "—")}</td><td><b>${esc(tdbName(r.komponen))}</b></td><td><code>${esc(r.sn || "—")}</code></td>
    <td>${esc(r.merk || "—")}</td><td class="num">${esc(r.kv || "—")}</td><td class="num">${esc(r.mva || "—")}</td>
    <td>${esc(r.gi)}<div class="muted sm">${esc(r.upt)}</div></td><td class="num">${esc(r.tahun || "—")}</td>
    <td><span class="badge ${tdbSt(r.status).tone}">${tdbSt(r.status).label}</span></td>
    <td class="ket">${esc(r.keterangan || "—")}</td><td>${r.powerInspect ? `<span class="pi-ok" title="Sesuai dengan Power Inspect">${icon("check", "ic xs")}</span>` : ""}</td>
    <td class="act"><button class="btn ghost sm" type="button" onclick="tdbOpenDetail(${i})" aria-label="Detail ${esc(tdbName(r.komponen))} di ${esc(r.gi)}">Detail</button><button class="icon-btn sm" type="button" onclick="tdbOpenForm(${i})" aria-label="Edit ${esc(tdbName(r.komponen))} di ${esc(r.gi)}" title="Edit"><svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg></button></td></tr>`).join("");

  /* saran isian untuk form */
  const uniq = k => [...new Set(rows.map(r => r[k]).filter(Boolean))].sort();
  [["tdbKomponenList", "komponen"], ["tdbMerkList", "merk"]]
    .forEach(([id, k]) => { $("#" + id).innerHTML = uniq(k).map(v => `<option value="${esc(v)}"></option>`).join(""); });

  tdbFilter();
}

function tdbFilter() {
  const q = $("#tdbSearch").value.trim().toLowerCase(), loc = $("#tdbLoc").value, st = $("#tdbStatus .on")?.dataset.v || "";
  let n = 0;
  document.querySelectorAll("#tdbRows tr").forEach(tr => {
    const ok = (!q || tr.textContent.toLowerCase().includes(q)) && (!loc || tr.dataset.key === loc) && (!st || tr.dataset.st === st);
    tr.hidden = !ok; if (ok) n++;
  });
  $("#tdbEmpty").hidden = n > 0;
  $("#tdbCount").textContent = `Menampilkan ${n} dari ${TDB.rows.length} komponen`;
}
function tdbReset() {
  $("#tdbSearch").value = ""; $("#tdbLoc").value = "";
  $("#tdbStatus button")?.click();
}

function tdbSetSync(state, text) {
  const el = $("#tdbSync");
  el.className = "chip sync " + state;
  el.innerHTML = `<i class="live-dot"></i>${esc(text)}`;
}

async function tdbLoad() {
  if (!TDB_API) {
    tdbSetSync("static", "Data statis · edit belum aktif");
    $("#tdbReload").hidden = true;
    $("#tdbSync").title = "Isi trafoDbApi di config.js dengan URL Apps Script agar data live & bisa diedit (lihat README).";
    return;
  }
  tdbSetSync("loading", "Memuat dari Google Sheets…");
  $("#tdbSyncNote").textContent = "";
  try {
    const res = await fetch(TDB_API, { cache: "no-store" });
    const j = await res.json();
    if (!j.ok) throw new Error(j.error || "Gagal memuat");
    TDB.rows = j.rows; TDB.source = j.source || TDB.source; TDB.live = true;
    renderTrafoDb();
    tdbSetSync("live", "Live · Google Sheets");
    $("#tdbSyncNote").textContent = `Tersambung ke spreadsheet · dimuat ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
  } catch (e) {
    TDB.live = false;
    tdbSetSync("error", "Gagal terhubung · menampilkan data statis");
    const net = e instanceof TypeError || /failed to fetch|networkerror|load failed/i.test(String(e.message || e));
    $("#tdbSyncNote").textContent = net
      ? "Apps Script tidak bisa diakses tanpa login. Pastikan deployment Web app memakai Who has access: \"Anyone\" (bukan \"Anyone with Google account\")."
      : String(e.message || e);
    $("#tdbSync").title = String(e.message || e);
  }
}

/* ---------- Form tambah / edit ---------- */
function tdbBuildForm() {
  $("#tdbFields").innerHTML = TDB_FIELDS.map(([k, label, type, o = {}]) => {
    if (type === "loc") return `<div class="fld-group wide"><div class="fld-group-h">${label}</div>${locPickerHtml("loc", true)}</div>`;
    if (type === "aset") return `<div class="fld-group wide"><div class="fld-group-h">${label} <small>gabungan nama UPT dan gardu induk</small>
        <button class="btn ghost sm" type="button" onclick="asetFromLoc()">Samakan dengan lokasi penempatan</button></div>
        ${locPickerHtml("na", false)}<p class="aset-preview" id="naPreview"></p></div>`;
    const attrs = `id="f_${k}" name="${k}"${o.required ? " required" : ""}${o.list ? ` list="${o.list}"` : ""}${o.inputmode ? ` inputmode="${o.inputmode}"` : ""}${o.pattern ? ` pattern="${o.pattern}"` : ""}${o.placeholder ? ` placeholder="${esc(o.placeholder)}"` : ""}`;
    const input = type === "select-anom"
      ? `<select ${attrs}><option value="">— Tidak ada / belum diisi —</option>${TDB_ANOM.map(v => `<option>${v}</option>`).join("")}</select>`
      : type === "select"
      ? `<select ${attrs}>${Object.keys(TDB_STATUS).map(s => `<option value="${s === "BELUM DIPASTIKAN" ? "" : s}">${tdbSt(s).label}</option>`).join("")}</select>`
      : type === "textarea" ? `<textarea ${attrs} rows="3"></textarea>` : `<input type="text" ${attrs} autocomplete="off">`;
    return `<label class="fld${o.wide ? " wide" : ""}" data-f="${k}"><span>${label}${o.required ? ' <em>*</em>' : ""}</span>${input}<small class="hint"></small></label>`;
  }).join("");
}

function locPickerHtml(p, required) {
  const req = required ? ' <em>*</em>' : "";
  return `<label class="fld"><span>UPT${req}</span>
      <select id="${p}_upt" data-req="${required}" onchange="locUptChanged('${p}')"></select>
      <input type="text" id="${p}_upt_text" placeholder="Nama unit di luar UIT JBM" hidden autocomplete="off"></label>
    <label class="fld"><span>Gardu induk${req}</span>
      <select id="${p}_gi" onchange="asetPreview()"></select>
      <input type="text" id="${p}_gi_text" placeholder="Nama gardu induk / lokasi" hidden autocomplete="off" oninput="asetPreview()"></label>`;
}
/* isi pilihan UPT; `extras` = UPT di luar daftar (mis. UIP3B …) yang ada di data */
function locFill(p, upt, gi) {
  const extras = [...new Set(TDB.rows.map(r => r.upt).filter(u => u && !uptCanon(u)))].sort();
  const cu = uptCanon(upt);
  const outside = upt && !cu ? upt : "";
  if (outside && !extras.includes(outside)) extras.push(outside);
  $(`#${p}_upt`).innerHTML = `<option value="">Pilih UPT…</option>` +
    `<optgroup label="UIT JBM">${UPT_LIST.map(u => `<option>${esc(u)}</option>`).join("")}</optgroup>` +
    (extras.length ? `<optgroup label="Di luar UIT JBM">${extras.map(u => `<option value="${esc(u)}">${esc(u)}</option>`).join("")}</optgroup>` : "") +
    `<option value="__other">Lainnya (isi manual)…</option>`;
  $(`#${p}_upt`).value = cu || outside || "";
  locUptChanged(p, gi);
}
function locUptChanged(p, gi) {
  const sel = $(`#${p}_upt`), v = sel.value, req = sel.dataset.req === "true";
  const inList = UPT_LIST.includes(v), other = v === "__other";
  const ut = $(`#${p}_upt_text`), gs = $(`#${p}_gi`), gt = $(`#${p}_gi_text`);
  ut.hidden = !other; ut.required = req && other; if (!other) ut.value = "";
  if (gi === undefined) gi = !inList && !gt.hidden ? gt.value : ""; // ganti UPT → pilih GI ulang
  if (inList) {
    const byUltg = {};
    GI_LIST.filter(x => x.upt === v).forEach(x => (byUltg[x.ultg] = byUltg[x.ultg] || []).push(x.gi));
    const cg = giCanon(gi, v);
    const legacy = gi && !cg ? gi : "";
    gs.innerHTML = `<option value="">Pilih gardu induk…</option>` +
      (legacy ? `<optgroup label="Data saat ini (tidak ada di daftar)"><option value="${esc(legacy)}">${esc(legacy)}</option></optgroup>` : "") +
      Object.entries(byUltg).map(([u, list]) => `<optgroup label="${esc(u)}">${list.map(g => `<option>${esc(g)}</option>`).join("")}</optgroup>`).join("");
    gs.value = cg || legacy || "";
    gs.hidden = false; gs.disabled = false; gs.required = req; gt.hidden = true; gt.required = false; gt.value = "";
  } else if (v) {
    gs.hidden = true; gs.required = false; gt.hidden = false; gt.required = req; gt.value = gi || "";
  } else {
    gs.innerHTML = `<option value="">Pilih UPT dulu</option>`; gs.disabled = true; gs.hidden = false; gs.required = false;
    gt.hidden = true; gt.required = false;
  }
  asetPreview();
}
function locGet(p) {
  const v = $(`#${p}_upt`).value;
  const upt = v === "__other" ? $(`#${p}_upt_text`).value.trim() : v;
  const gi = ($(`#${p}_gi`).hidden ? $(`#${p}_gi_text`).value : $(`#${p}_gi`).value).trim();
  return { upt, gi };
}
function asetCompose() { const { upt, gi } = locGet("na"); return upt && gi ? `${upt} - ${gi}` : ""; }
function asetPreview() {
  const el = $("#naPreview"); if (!el) return;
  const v = asetCompose();
  el.innerHTML = v ? `Nama aset tersimpan: <b>${esc(v)}</b>` : "Pilih UPT dan gardu induk untuk membentuk nama aset.";
}
function asetFromLoc() {
  const { upt, gi } = locGet("loc");
  locFill("na", upt, gi);
}
function asetSplit(v) {
  const i = String(v || "").indexOf(" - ");
  return i < 0 ? { upt: "", gi: v || "" } : { upt: v.slice(0, i).trim(), gi: v.slice(i + 3).trim() };
}

function tdbOpenForm(i) {
  const r = i == null ? null : TDB.rows[i];
  TDB.editing = r;
  const f = $("#tdbForm");
  f.reset();
  $("#tdbFormTitle").textContent = r ? "Edit komponen" : "Tambah komponen";
  $("#tdbFormSub").textContent = r ? `${tdbName(r.komponen)} · ${r.gi}` : "Baris baru akan ditambahkan di akhir sheet 2. TRAFO MOBILE";
  locFill("loc", r ? r.upt : "", r ? r.gi : "");
  const na = asetSplit(r && r.namaAset);
  locFill("na", na.upt, na.gi);
  TDB_FIELDS.forEach(([k, , type, o = {}]) => {
    if (type === "loc" || type === "aset") return;
    const el = $("#f_" + k);
    if (k === "statusAnomali") {
      el.querySelectorAll("option[data-extra]").forEach(o => o.remove());
      const cur = r && r.statusAnomali;
      if (cur && !TDB_ANOM.some(v => v.toLowerCase() === cur.toLowerCase())) el.insertAdjacentHTML("beforeend", `<option data-extra>${esc(cur)}</option>`);
      el.value = cur ? (TDB_ANOM.find(v => v.toLowerCase() === cur.toLowerCase()) || cur) : "";
      return;
    }
    el.value = r ? (k === "status" ? (r.status === "BELUM DIPASTIKAN" ? "" : r.status) : (r[k] ?? "")) : (k === "status" ? "OPERASI" : "");
  });
  const canSave = !!TDB_API && TDB.live && (!r || r._row);
  $("#tdbFormWarn").hidden = canSave;
  $("#tdbFormWarn").textContent = !TDB_API
    ? "Google Sheets belum terhubung, jadi perubahan belum bisa disimpan. Ikuti panduan di README (bagian Edit Database Trafo Mobile)."
    : "Data belum termuat dari Google Sheets. Muat ulang halaman lalu coba lagi.";
  $("#tdbSave").disabled = !canSave;
  $("#tdbTokenWrap").hidden = !canSave;
  tdbTokenUi();
  $("#tdbFormErr").hidden = true;
  $("#tdbDialog").showModal();
  setTimeout(() => $("#f_komponen").focus(), 30);
}
function tdbCloseForm() { $("#tdbDialog").close(); }

async function tdbSubmit(ev) {
  ev.preventDefault();
  const f = $("#tdbForm"), r = TDB.editing;
  if (!f.reportValidity()) return;
  const data = {};
  const loc = locGet("loc"), aset = asetCompose();
  const put = (k, v, same) => { if (r ? !same : v) data[k] = v; };
  put("upt", loc.upt, r && (loc.upt.toUpperCase() === String(r.upt || "").toUpperCase() || (uptCanon(loc.upt) && uptCanon(loc.upt) === uptCanon(r.upt))));
  put("gi", loc.gi, r && (loc.gi.toUpperCase() === String(r.gi || "").toUpperCase() || giSame(loc.gi, r.gi)));
  const oldA = asetSplit(r && r.namaAset);
  put("namaAset", aset, r && (aset.toUpperCase() === String(r.namaAset || "").toUpperCase() ||
    (!!aset && uptCanon(asetSplit(aset).upt) === uptCanon(oldA.upt) && !!uptCanon(oldA.upt) && giSame(asetSplit(aset).gi, oldA.gi)) || (!aset && !r.namaAset)));
  TDB_FIELDS.forEach(([k, , type, o = {}]) => {
    if (type === "loc" || type === "aset") return;
    const el = $("#f_" + k);
    if (el.disabled) return;
    const v = el.value.trim();
    if (r) { const old = k === "status" ? (r.status === "BELUM DIPASTIKAN" ? "" : r.status) : (r[k] ?? ""); if (v === String(old)) return; }
    if (!r && !v) return;
    data[k] = v;
  });
  if (r && !Object.keys(data).length) { tdbCloseForm(); toast("Tidak ada perubahan"); return; }
  const token = $("#f_token").value.trim();
  if (!token) { $("#f_token").focus(); return tdbErr("Masukkan kode akses edit."); }
  const btn = $("#tdbSave"); btn.disabled = true; btn.textContent = "Menyimpan…";
  try {
    const res = await fetch(TDB_API, { method: "POST", body: JSON.stringify({ token, action: r ? "update" : "add", row: r && r._row, expect: r && r.komponen, data }) });
    const j = await res.json();
    if (!j.ok) {
      if (j.code === "auth") { tokenForget(true); }
      throw new Error(j.error || "Gagal menyimpan");
    }
    tokenSave(token);
    if (r) Object.assign(r, j.row || data); else TDB.rows.push(j.row);
    renderTrafoDb();
    tdbCloseForm();
    toast(r ? "Perubahan tersimpan ke Google Sheets" : "Komponen baru ditambahkan ke Google Sheets");
  } catch (e) {
    tdbErr(String(e.message || e));
  } finally {
    btn.disabled = false; btn.textContent = "Simpan";
  }
}
/* Kode akses edit diingat permanen di browser ini (cukup dimasukkan sekali per perangkat) */
const TOKEN_KEY = "fashar-edit-token";
function tokenGet() {
  try {
    const legacy = sessionStorage.getItem(TOKEN_KEY); // versi lama menyimpan di sessionStorage
    if (legacy) { localStorage.setItem(TOKEN_KEY, legacy); sessionStorage.removeItem(TOKEN_KEY); }
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch (e) { return ""; }
}
function tokenSave(t) { try { localStorage.setItem(TOKEN_KEY, t); } catch (e) { } }
function tokenForget(silent) {
  try { localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY); } catch (e) { }
  if ($("#tdbDialog").open) { $("#f_token").value = ""; tdbTokenUi(); }
  if (!silent) toast("Kode akses dihapus dari perangkat ini");
}
function tdbTokenUi() {
  const tok = tokenGet();
  $("#f_token").value = tok;
  $("#tokenInput").hidden = !!tok;
  $("#tokenSaved").hidden = !tok;
}

function tdbErr(msg) { const el = $("#tdbFormErr"); el.textContent = msg; el.hidden = false; }

/* ---------- Pop-up detail ---------- */
const tdbRp = v => {
  if (!v) return null;
  const n = Number(String(v).replace(/[^\d]/g, ""));
  return n ? "Rp " + fmt(n) : String(v);
};
const tdbNilai = (v, ref) => v || ref ? `${v ? `<b class="dval">${esc(tdbRp(v))}</b>` : ""}${ref ? `<span class="dref">${esc(ref)}</span>` : ""}` : null;
const tdbUrl = v => /^https?:\/\//i.test(v || "");
function tdbDl(items) {
  return `<dl class="dgrid">${items.map(([l, v, o = {}]) => `<div class="${o.wide ? "wide" : o.span2 ? "span2" : ""}"><dt>${l}</dt><dd class="${v ? "" : "nil"}${o.pre ? " pre" : ""}">${v ? (o.html ? v : esc(v)) : "—"}</dd></div>`).join("")}</dl>`;
}
function tdbLink(v, label) {
  if (!v) return null;
  return tdbUrl(v) ? `<a class="btn ghost sm" href="${esc(v)}" target="_blank" rel="noopener">${label} <svg viewBox="0 0 24 24"><path d="M7 17 17 7M9 7h8v8"/></svg></a>` : esc(v);
}
function tdbOpenDetail(i) {
  const r = TDB.rows[i]; if (!r) return;
  TDB.detail = i;
  const st = tdbSt(r.status);
  $("#tdbDetailTitle").textContent = tdbName(r.komponen);
  $("#tdbDetailSub").innerHTML = `${esc(r.gi)} · ${esc(r.upt)} <span class="badge ${st.tone}">${st.label}</span>${tdbOutside(r) ? ' <span class="badge warn">Di luar UIT JBM</span>' : ""}`;
  const riw = (r.riwayat || []);
  const sec = (t, body, ic) => `<section class="dsec"><h4>${icon(ic, "ic xs")}${t}</h4>${body}</section>`;
  $("#tdbDetailBody").innerHTML =
    sec("Identitas komponen", tdbDl([
      ["Komponen", r.komponen], ["No", r.no], ["Serial number", r.sn], ["Merk", r.merk],
      ["Tegangan", r.kv && r.kv + " kV"], ["Kapasitas", r.mva && r.mva + " MVA"], ["Tahun buatan", r.tahun], ["Identitas", r.identitas]
    ]), "transformer") +
    sec("Lokasi & status", tdbDl([
      ["UPT", r.upt], ["Gardu induk", r.gi], ["Status", r.status === "BELUM DIPASTIKAN" ? null : st.label], ["Tanggal dioperasikan", r.tanggalOperasi],
      ["Nama aset", r.namaAset], ["Lokasi awal", r.lokasiAwal], ["Keterangan", r.keterangan, { wide: true, pre: true }]
    ]), "location") +
    sec("Informasi aset", tdbDl([
      ["Nomor TID", r.nomorTid], ["Nomor asset", r.nomorAsset],
      ["Nilai aset (referensi 1)", tdbNilai(r.nilaiAset1, r.refAset1), { html: true, span2: true }],
      ["Nilai aset (referensi 2)", tdbNilai(r.nilaiAset2, r.refAset2), { html: true, span2: true }]
    ]), "doc") +
    sec("Anomali", tdbDl([
      ["Status anomali", r.statusAnomali && `<span class="badge ${anomTone(r.statusAnomali)}">${esc(r.statusAnomali)}</span>`, { html: true }],
      ["Dokumen pendukung", tdbLink(r.dokumenAnomali, "Buka dokumen"), { html: true }],
      ["Uraian anomali", r.anomali, { wide: true, pre: true }], ["Tindak lanjut & mitigasi", r.tindakLanjut, { wide: true, pre: true }]
    ]), "alert") +
    sec("Dokumentasi", tdbDl([
      ["Foto peralatan", tdbLink(r.linkFoto, "Lihat foto"), { html: true }],
      ["Nameplate", tdbLink(r.linkNameplate, "Lihat nameplate"), { html: true }],
      ["Pemeliharaan", tdbLink(r.linkPemeliharaan, "Lihat data"), { html: true }],
      ["Kesesuaian dengan Power Inspect", r.powerInspect ? `<span class="badge ok">${icon("check", "ic xs")}Sesuai</span>` : null, { html: true }]
    ]), "search") +
    sec("Riwayat lokasi", riw.some(x => x.lokasi || x.ba)
      ? `<div class="table-wrap flat"><table class="table"><thead><tr><th>Tahun</th><th>Lokasi</th><th>BA</th></tr></thead><tbody>${riw.map(x => `<tr><td><b>${x.tahun}</b></td><td>${esc(x.lokasi || "—")}</td><td>${tdbLink(x.ba, "Lihat BA") || "—"}</td></tr>`).join("")}</tbody></table></div>`
      : `<p class="dnil">Belum ada riwayat lokasi 2020–2025 yang tercatat.</p>`, "rotate");
  $("#tdbDetail").showModal();
}
function tdbCloseDetail() { $("#tdbDetail").close(); }
function tdbDetailEdit() { const i = TDB.detail; tdbCloseDetail(); tdbOpenForm(i); }

function initTrafoDb() {
  if (!$("#page-trafodb")) return;
  tdbBuildForm();
  $("#tdbSearch").addEventListener("input", tdbFilter);
  $("#tdbLoc").addEventListener("change", tdbFilter);
  $("#tdbStatus").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    $("#tdbStatus").querySelectorAll("button").forEach(x => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b); });
    tdbFilter();
  });
  $("#tdbForm").addEventListener("submit", tdbSubmit);
  $("#tdbDialog").addEventListener("click", e => { if (e.target === $("#tdbDialog")) tdbCloseForm(); });
  $("#tdbDetail").addEventListener("click", e => { if (e.target === $("#tdbDetail")) tdbCloseDetail(); });
  renderTrafoDb();
  tdbLoad();
}
initTrafoDb();

/* =========================================================
   NAVIGATION (hash routing: bisa di-bookmark & tombol back)
   ========================================================= */
const PAGES = {
  kinerja: ["PDKB", "Kinerja PDKB", "Rekap kinerja PDKB UIT JBM tahun 2026"],
  optimalisasi: ["PDKB", "Optimalisasi PDKB", "Capaian optimalisasi Gardu Induk & Jaringan per UPT"],
  health: ["Kondisi Aset", "Health Index", "Sebaran prioritas temuan aset Jaringan dan Gardu Induk"],
  jar: ["Kondisi Aset", "Asesmen JAR", "Health index aset jaringan per UPT"],
  gi: ["Kondisi Aset", "Asesmen GI", "Health index aset gardu induk per UPT"],
  tower: ["Peralatan ERS", "Tower Emergency", "Ketersediaan & inventaris tower emergency (ERS)"],
  trafo: ["Peralatan ERS", "Trafo Mobile", "Status, lokasi, dan peminjaman trafo mobile"],
  trafodb: ["Peralatan ERS", "Database Trafo Mobile", "Data komponen trafo mobile dari Database Alat Berat UIT JBM"]
};
function route() {
  const id = PAGES[location.hash.slice(1)] ? location.hash.slice(1) : "kinerja";
  document.querySelectorAll(".page").forEach(p => p.classList.toggle("active", p.id === "page-" + id));
  document.querySelectorAll(".nav-item").forEach(n => {
    const on = n.dataset.page === id;
    n.classList.toggle("active", on);
    on ? n.setAttribute("aria-current", "page") : n.removeAttribute("aria-current");
  });
  const [g, t, s] = PAGES[id];
  $("#pageGroup").textContent = g; $("#pageTitle").textContent = t; $("#pageSub").textContent = s;
  document.title = `${t} · Dashboard FASHAR UIT JBM`;
  closeDrawer();
  window.scrollTo({ top: 0 });
}
addEventListener("hashchange", route);
route();

function openDrawer() { document.body.classList.add("drawer-open"); }
function closeDrawer() { document.body.classList.remove("drawer-open"); }
addEventListener("keydown", e => { if (e.key === "Escape") closeDrawer(); });

function store(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
function toggleCollapse() {
  const on = document.documentElement.classList.toggle("nav-collapsed");
  store("fashar-collapsed", on ? "1" : "0");
}
function toggleTheme() {
  const root = document.documentElement;
  const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = dark ? "light" : "dark";
  store("fashar-theme", root.dataset.theme);
}
