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
  pulse: '<path d="M3 12h4l2-5 4 10 2-5h6"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13.5" r="3.5"/>'
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
  }
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
          <span class="bt"><span class="stk" style="width:${w}%">${r.p.map((v, k) => `<i style="flex:${v};background:var(--p${k + 1})"></i>`).join("")}</span></span><b>${fmt(t)}</b></li>`;
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
/* Nama komponen ditampilkan persis sesuai daftar resmi (TDB_KOMPONEN), mis. "MOBILE POWER TRANSFORMER" */
const tdbName = k => { const t = String(k || "").replace(/\s+/g, " ").trim(); return (typeof TDB_KOMPONEN !== "undefined" && TDB_KOMPONEN.find(v => v.toUpperCase() === t.toUpperCase())) || t.toUpperCase(); };
const tdbKey = r => (r.gi || "-").replace(/\s+/g, "").toUpperCase();
const tdbOutside = r => /^UIP3B/i.test(r.upt || "");
const TDB_KOMPONEN = ["MOBILE POWER TRANSFORMER", "MOBILE SWITCHGEAR", "MOBILE CUBICLE", "MOBILE CONTROL ROOM PANEL", "MOBILE CUBICLE (CABLE & CONTROL ROOM PANEL)"];
const TDB_ANOM = ["Open", "In Progress", "Close"]; // harus sama dengan validasi data kolom N di sheet 2. TRAFO MOBILE
const anomTone = s => /open/i.test(s || "") ? "bad" : /progress|proses/i.test(s || "") ? "warn" : /close|selesai/i.test(s || "") ? "ok" : "muted";
const TDB_API = (window.FASHAR_CONFIG && window.FASHAR_CONFIG.trafoDbApi || "").trim();
const TDB = {
  rows: (window.TRAFO_DB && window.TRAFO_DB.rows) || [],
  source: (window.TRAFO_DB && window.TRAFO_DB.source) || "",
  live: false, editing: null, moves: []
};
const TDB_FIELDS = [
  ["komponen", "Komponen", "select-komp", { required: true, wide: true }],
  ["status", "Status", "select"],
  ["no", "No", "text", { inputmode: "numeric" }],
  ["sn", "Serial number", "text"],
  ["merk", "Merk", "text", { list: "tdbMerkList" }],
  ["kv", "Tegangan (kV)", "text", { placeholder: "mis. 150/20" }],
  ["mva", "Kapasitas (MVA)", "text", { inputmode: "decimal" }],
  ["tahun", "Tahun buatan", "text", { inputmode: "numeric", pattern: "\\d{4}", placeholder: "YYYY" }],
  ["lokasi", "Lokasi penempatan", "loc"],
  ["pindah", "Perpindahan lokasi", "move"],
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

  TDB.locs = locs;
  tdbRenderMap();

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
    <td>${esc(r.gi)}<div class="muted sm">${esc(r.upt)}</div>${(() => { const m = tdbMovesOf(r).slice(-1)[0]; return m ? `<div class="mv-last">${icon("rotate", "ic xs")}Pindah ${esc(fmtD(m.tanggal))}</div>` : ""; })()}</td><td class="num">${esc(r.tahun || "—")}</td>
    <td><span class="badge ${tdbSt(r.status).tone}">${tdbSt(r.status).label}</span></td>
    <td class="ket">${esc(r.keterangan || "—")}</td><td>${r.powerInspect ? `<span class="pi-ok" title="Sesuai dengan Power Inspect">${icon("check", "ic xs")}</span>` : ""}</td>
    <td class="act"><button class="btn ghost sm" type="button" onclick="tdbOpenDetail(${i})" aria-label="Detail ${esc(tdbName(r.komponen))} di ${esc(r.gi)}">Detail</button><button class="icon-btn sm" type="button" onclick="tdbOpenForm(${i})" aria-label="Edit ${esc(tdbName(r.komponen))} di ${esc(r.gi)}" title="Edit"><svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg></button></td></tr>`).join("");

  /* saran isian untuk form */
  const uniq = k => [...new Set(rows.map(r => r[k]).filter(Boolean))].sort();
  [["tdbMerkList", "merk"]]
    .forEach(([id, k]) => { $("#" + id).innerHTML = uniq(k).map(v => `<option value="${esc(v)}"></option>`).join(""); });

  tdbFilter(true); // pertahankan halaman setelah simpan / muat ulang
}

/* =========================================================
   PETA LOKASI PENEMPATAN (Leaflet, vendor/leaflet)
   ========================================================= */
/* Koordinat perkiraan per gardu induk (kunci = nama GI tanpa jenis/tegangan) */
const TDB_COORDS = {
  KALISARI: [-7.268, 112.794], TANDES: [-7.250, 112.676], NGORO: [-7.556, 112.627], PAITON: [-7.716, 113.574],
  GIANYAR: [-8.535, 115.330], NEWTULUNGAGUNG: [-8.091, 111.917], GARUDASAKTIRIAU: [0.465, 101.380], IKN: [-0.970, 116.700],
  MANGGARSARIBALIKPAPAN: [-1.236, 116.855]
};
const tdbCoord = g => TDB_COORDS[giParts(g.name).name] || null;
function tdbLocTone(g) {
  const has = s => g.rows.some(r => r.status === s);
  return has("RUSAK") ? "RUSAK" : has("STANDBY") ? "STANDBY" : has("OPERASI") ? "OPERASI" : "BELUM DIPASTIKAN";
}
const TDB_MAP = { map: null, layer: null, tiles: null, markers: {}, sel: null };
/* Rute perpindahan komponen di lokasi terpilih (garis putus-putus antar GI) */
function tdbDrawRoutes(key) {
  if (!TDB_MAP.map) return [];
  if (!TDB_MAP.route) TDB_MAP.route = L.layerGroup().addTo(TDB_MAP.map);
  TDB_MAP.route.clearLayers();
  const g = key && (TDB.locs || []).find(x => x.key === key); if (!g) return [];
  const C = name => TDB_COORDS[giParts(name).name] || null, all = [], seen = new Set();
  g.rows.forEach(r => {
    const ms = tdbMovesOf(r); if (!ms.length) return;
    const seq = [{ gi: ms[0].dariGi, t: "" }, ...ms.map(m => ({ gi: m.keGi, t: m.tanggal }))].filter(x => C(x.gi));
    const sig = seq.map(x => nrm(x.gi) + x.t).join(">"); if (seq.length < 2 || seen.has(sig)) return; seen.add(sig);
    const line = seq.map(x => C(x.gi)); all.push(...line);
    L.polyline(line, { color: "#1667D9", weight: 3, opacity: .85, dashArray: "6 8" }).addTo(TDB_MAP.route);
    seq.slice(0, -1).forEach((x, i) => L.circleMarker(C(x.gi), { radius: 6, color: "#1667D9", weight: 2, fillColor: "#fff", fillOpacity: 1 })
      .bindTooltip(`${esc(x.gi)}${i ? " · s.d. " : " · sebelum "}${esc(fmtD(seq[i + 1].t))}`, { direction: "top" }).addTo(TDB_MAP.route));
  });
  return all;
}
function tdbIsDark() {
  const t = document.documentElement.dataset.theme;
  return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
}
function tdbTiles() {
  if (!TDB_MAP.map) return;
  if (TDB_MAP.tiles) TDB_MAP.map.removeLayer(TDB_MAP.tiles);
  // OpenStreetMap (tanpa API key). Mode gelap memakai filter CSS pada tile (.tiles-dark).
  TDB_MAP.tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18, className: tdbIsDark() ? "tiles-dark" : "",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
  }).addTo(TDB_MAP.map);
}
function tdbMapInit() {
  if (TDB_MAP.map || !window.L || !$("#tdbMap")) return !!TDB_MAP.map;
  TDB_MAP.map = L.map("tdbMap", { zoomControl: true, scrollWheelZoom: false, attributionControl: true, minZoom: 4 }).setView([-4, 115], 5);
  tdbTiles();
  TDB_MAP.layer = L.layerGroup().addTo(TDB_MAP.map);
  TDB_MAP.map.on("click", () => tdbSelectLoc(null));
  return true;
}
function tdbFit(area) {
  const m = TDB_MAP.map; if (!m) return;
  const pts = (TDB.locs || []).map(tdbCoord).filter(Boolean);
  if (area === "jatim") m.fitBounds([[-6.6, 110.9], [-8.9, 115.8]], { padding: [20, 20] });
  else if (pts.length) m.fitBounds(pts, { padding: [40, 40], maxZoom: 7 });
  document.querySelectorAll("#tdbMapTools .pg").forEach(b => b.classList.toggle("on", b.dataset.area === (area || "all")));
}
function tdbMapResize() { if (TDB_MAP.map) { TDB_MAP.map.invalidateSize(); if (!TDB_MAP.fitted) { tdbFit(); TDB_MAP.fitted = true; } } }
function tdbRenderMap() {
  const locs = TDB.locs || [];
  const ok = tdbMapInit();
  $("#tdbMapFallback").hidden = ok;
  if (ok) {
    TDB_MAP.layer.clearLayers(); TDB_MAP.markers = {};
    locs.forEach(g => {
      const c = tdbCoord(g); if (!c) return;
      const st = tdbSt(tdbLocTone(g));
      const icon = L.divIcon({ className: "tm-icon", iconSize: [34, 34], iconAnchor: [17, 17],
        html: `<span class="tm-pin${TDB_MAP.sel === g.key ? " sel" : ""}" style="--c:${st.color}">${g.rows.length}</span>` });
      const mk = L.marker(c, { icon, title: `${g.name} · ${g.rows.length} komponen`, keyboard: true, riseOnHover: true })
        .on("click", e => { L.DomEvent.stopPropagation(e); tdbSelectLoc(g.key, true); })
        .bindTooltip(`<b>${esc(g.name)}</b><br>${esc(g.upt)} · ${g.rows.length} komponen`, { direction: "top", offset: [0, -16] });
      mk.addTo(TDB_MAP.layer); TDB_MAP.markers[g.key] = mk;
    });
  }
  if (TDB_MAP.sel && !locs.some(g => g.key === TDB_MAP.sel)) TDB_MAP.sel = null;
  tdbRenderPanel();
}
function tdbSelectLoc(key, fromMap) {
  TDB_MAP.sel = key;
  Object.entries(TDB_MAP.markers).forEach(([k, mk]) => { const el = mk.getElement && mk.getElement(); if (el) el.querySelector(".tm-pin")?.classList.toggle("sel", k === key); });
  const pts = tdbDrawRoutes(key);
  if (key && TDB_MAP.map && !fromMap) {
    const g = TDB.locs.find(x => x.key === key), c = g && tdbCoord(g);
    if (pts.length > 1) TDB_MAP.map.flyToBounds(pts, { padding: [50, 50], maxZoom: 10, duration: .6 });
    else if (c) TDB_MAP.map.flyTo(c, Math.max(TDB_MAP.map.getZoom(), 10), { duration: .6 });
  }
  tdbRenderPanel();
}
function tdbRenderPanel() {
  const el = $("#tdbLocPanel"), locs = TDB.locs || [];
  const g = TDB_MAP.sel && locs.find(x => x.key === TDB_MAP.sel);
  if (!g) {
    el.innerHTML = `<div class="lp-head"><h3>${locs.length} lokasi penempatan</h3><p>Klik tanda pada peta atau pilih lokasi di bawah.</p></div>
      <ul class="lp-list">${locs.map(x => {
        const st = tdbSt(tdbLocTone(x));
        return `<li><button type="button" data-k="${esc(x.key)}"><i class="dot" style="background:${st.color}"></i>
          <span><b>${esc(x.name)}</b><small>${esc(x.upt)}${tdbOutside(x.rows[0]) ? " · di luar UIT JBM" : ""}${tdbCoord(x) ? "" : " · belum ada titik peta"}</small></span>
          <em>${x.rows.length}</em></button></li>`;
      }).join("")}</ul>`;
    return;
  }
  const out = tdbOutside(g.rows[0]);
  const counts = Object.keys(TDB_STATUS).map(s => [s, g.rows.filter(r => r.status === s).length]).filter(x => x[1]);
  const ket = [...new Set(g.rows.map(r => r.keterangan).filter(Boolean))];
  const asal = [...new Set(g.rows.map(r => r.namaAset).filter(Boolean))];
  el.innerHTML = `<div class="lp-head"><button type="button" class="linkbtn lp-back" data-k="">‹ Semua lokasi</button>
      <h3>${esc(g.name)}</h3><p>${esc(g.upt)}${out ? ' <span class="badge warn">Di luar UIT JBM</span>' : ""}</p>
      <div class="tdb-chips flat">${counts.map(([s, n]) => `<span class="badge ${tdbSt(s).tone}">${n} ${tdbSt(s).label}</span>`).join("")}</div></div>
    <ul class="tdb-parts lp-parts">${g.rows.map(r => `<li>
      <i class="dot" style="background:${tdbSt(r.status).color}" title="${tdbSt(r.status).label}"></i>
      <div><b>${esc(tdbName(r.komponen))}</b><span>${[r.merk, r.kv && r.kv + " kV", r.mva && r.mva + " MVA", r.tahun].filter(Boolean).map(esc).join(" · ") || "Data belum lengkap"}</span></div>
      <button type="button" class="btn ghost sm" data-detail="${TDB.rows.indexOf(r)}">Detail</button></li>`).join("")}</ul>
    ${ket.length || asal.length ? `<div class="lp-note">${ket.length ? `<p>${ket.map(esc).join("<br>").replace(/\n/g, "<br>")}</p>` : ""}${asal.length ? `<p class="muted">Nama aset: ${asal.map(esc).join(", ")}</p>` : ""}</div>` : ""}
    <div class="lp-foot"><button type="button" class="btn ghost sm" data-table="${esc(g.key)}">Lihat di tabel komponen</button></div>`;
}
function tdbPanelClick(e) {
  const k = e.target.closest("[data-k]"), d = e.target.closest("[data-detail]"), t = e.target.closest("[data-table]");
  if (d) return tdbOpenDetail(+d.dataset.detail);
  if (t) { $("#tdbLoc").value = t.dataset.table; tdbFilter(); $("#tdbSearch").closest(".card").scrollIntoView({ behavior: "smooth", block: "start" }); return; }
  if (k) tdbSelectLoc(k.dataset.k || null);
}

/* Filter + paginasi (10 baris per halaman) */
const TDB_PER_PAGE = 10;
let tdbPage = 1, tdbShowAll = false;
function tdbFilter(keepPage) {
  if (keepPage !== true) tdbPage = 1;
  const q = $("#tdbSearch").value.trim().toLowerCase(), loc = $("#tdbLoc").value, st = $("#tdbStatus .on")?.dataset.v || "";
  const trs = [...document.querySelectorAll("#tdbRows tr")];
  const match = trs.filter(tr => (!q || tr.textContent.toLowerCase().includes(q)) && (!loc || tr.dataset.key === loc) && (!st || tr.dataset.st === st));
  const n = match.length, per = tdbShowAll ? Math.max(n, 1) : TDB_PER_PAGE, pages = Math.max(1, Math.ceil(n / per));
  tdbPage = Math.min(Math.max(1, tdbPage), pages);
  const from = (tdbPage - 1) * per, to = Math.min(from + per, n);
  const show = new Set(match.slice(from, to));
  trs.forEach(tr => { tr.hidden = !show.has(tr); });
  $("#tdbEmpty").hidden = n > 0;
  $("#tdbCount").textContent = n
    ? `Menampilkan ${from + 1}–${to} dari ${n} komponen${n < TDB.rows.length ? ` (difilter dari ${TDB.rows.length})` : ""}`
    : `Menampilkan 0 dari ${TDB.rows.length} komponen`;
  tdbPager(pages);
  const all = $("#tdbAll");
  all.hidden = n <= TDB_PER_PAGE;
  all.textContent = tdbShowAll ? `Tampilkan ${TDB_PER_PAGE} per halaman` : `Tampilkan semua (${n})`;
  all.setAttribute("aria-pressed", tdbShowAll);
}
function tdbToggleAll() {
  tdbShowAll = !tdbShowAll; tdbPage = 1; tdbFilter(true);
  if (!tdbShowAll) { const t = $("#tdbSearch").closest(".card"); if (t && t.getBoundingClientRect().top < 0) t.scrollIntoView({ behavior: "smooth", block: "start" }); }
}
function tdbPager(pages) {
  const el = $("#tdbPager");
  if (pages <= 1) { el.innerHTML = ""; return; }
  const nums = [];
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - tdbPage) <= 1) nums.push(p);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  el.innerHTML = `<button type="button" class="pg" data-p="${tdbPage - 1}" ${tdbPage === 1 ? "disabled" : ""} aria-label="Halaman sebelumnya">‹</button>` +
    nums.map(p => p === "…" ? `<span class="pg-gap">…</span>` : `<button type="button" class="pg${p === tdbPage ? " on" : ""}" data-p="${p}" aria-label="Halaman ${p}"${p === tdbPage ? ' aria-current="page"' : ""}>${p}</button>`).join("") +
    `<button type="button" class="pg" data-p="${tdbPage + 1}" ${tdbPage === pages ? "disabled" : ""} aria-label="Halaman berikutnya">›</button>`;
}
function tdbGoPage(p) {
  tdbPage = p; tdbFilter(true);
  const t = $("#tdbSearch").closest(".card"); if (t && t.getBoundingClientRect().top < 0) t.scrollIntoView({ behavior: "smooth", block: "start" });
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
    TDB.rows = j.rows; TDB.moves = j.moves || []; TDB.source = j.source || TDB.source; TDB.live = true;
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
    if (type === "move") return `<div class="fld-group wide mv-box" id="mvBox" hidden>
        <div class="fld-group-h">${icon("rotate", "ic xs")}${label} <small>lokasi berubah — perpindahan akan dicatat ke riwayat</small></div>
        <label class="fld"><span>Tanggal pindah <em>*</em></span><input type="date" id="f_mvDate"></label>
        <label class="fld"><span>No. BA</span><input type="text" id="f_mvBa" placeholder="Nomor berita acara (opsional)" autocomplete="off"></label>
        <label class="fld wide"><span>Dokumen BA <small>PDF / JPG / PNG / DOC, maks. 15 MB</small></span><input type="file" id="f_mvFile" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,application/pdf,image/jpeg,image/png"></label>
        <label class="fld wide"><span>Alasan / keterangan</span><input type="text" id="f_mvAlasan" placeholder="mis. Perkuatan GI karena pertumbuhan beban" autocomplete="off"></label>
        <label class="mv-set wide" id="mvSetWrap" hidden><input type="checkbox" id="f_mvSet" checked> <span id="mvSetLabel"></span></label></div>`;
    if (type === "aset") return `<div class="fld-group wide"><div class="fld-group-h">${label} <small>gabungan nama UPT dan gardu induk</small>
        <button class="btn ghost sm" type="button" onclick="asetFromLoc()">Samakan dengan lokasi penempatan</button></div>
        ${locPickerHtml("na", false)}<p class="aset-preview" id="naPreview"></p></div>`;
    const attrs = `id="f_${k}" name="${k}"${o.required ? " required" : ""}${o.list ? ` list="${o.list}"` : ""}${o.inputmode ? ` inputmode="${o.inputmode}"` : ""}${o.pattern ? ` pattern="${o.pattern}"` : ""}${o.placeholder ? ` placeholder="${esc(o.placeholder)}"` : ""}`;
    const input = type === "select-komp"
      ? `<select ${attrs}><option value="">Pilih komponen…</option>${TDB_KOMPONEN.map(v => `<option>${esc(v)}</option>`).join("")}</select>`
      : type === "select-anom"
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
/* Tampilkan isian perpindahan bila lokasi penempatan diubah (hanya saat edit) */
const locSame = (l, r) => (l.upt.toUpperCase() === String(r.upt || "").toUpperCase() || (!!uptCanon(l.upt) && uptCanon(l.upt) === uptCanon(r.upt))) &&
  (l.gi.toUpperCase() === String(r.gi || "").toUpperCase() || giSame(l.gi, r.gi));
const nrm = v => String(v || "").toUpperCase().replace(/\s+/g, "");
function tdbSetMates(r) {
  if (!r || !r.namaAset) return [];
  return TDB.rows.filter(x => x !== r && x.namaAset === r.namaAset && nrm(x.upt) === nrm(r.upt) && nrm(x.gi) === nrm(r.gi));
}
function tdbMoveUi() {
  const box = $("#mvBox"); if (!box) return;
  const r = TDB.editing, l = locGet("loc");
  const show = !!(r && r._row && l.upt && l.gi && !locSame(l, r));
  box.hidden = !show; $("#f_mvDate").required = show;
  if (show && !$("#f_mvDate").value) $("#f_mvDate").value = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  const mates = show ? tdbSetMates(r) : [];
  $("#mvSetWrap").hidden = !mates.length;
  if (mates.length) $("#mvSetLabel").innerHTML = `Pindahkan juga <b>${mates.length} komponen lain</b> dalam set yang sama (${mates.map(x => esc(tdbName(x.komponen))).join(", ")})`;
}
function asetPreview() {
  tdbMoveUi();
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
    if (type === "loc" || type === "aset" || type === "move") return;
    const el = $("#f_" + k);
    if (k === "komponen") {
      el.querySelectorAll("option[data-extra]").forEach(o => o.remove());
      const cur = r && r.komponen ? String(r.komponen).trim() : "";
      const hit = TDB_KOMPONEN.find(v => v.toUpperCase() === cur.toUpperCase());
      if (cur && !hit) el.insertAdjacentHTML("beforeend", `<option data-extra value="${esc(cur)}">${esc(cur)} (data lama)</option>`);
      el.value = hit || cur;
      return;
    }
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
  phOpen(r, true);
  MV.adding = false; MV.err = ""; mvRender();
  tdbMoveUi();
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
    if (type === "loc" || type === "aset" || type === "move") return;
    const el = $("#f_" + k);
    if (el.disabled) return;
    const v = el.value.trim();
    if (r) { const old = k === "status" ? (r.status === "BELUM DIPASTIKAN" ? "" : r.status) : (r[k] ?? ""); if (v === String(old)) return; }
    if (!r && !v) return;
    data[k] = v;
  });
  if (r && !Object.keys(data).length) { tdbCloseForm(); toast("Tidak ada perubahan"); return; }
  const move = r && !$("#mvBox").hidden ? { tanggal: $("#f_mvDate").value, alasan: $("#f_mvAlasan").value.trim(), ba: $("#f_mvBa").value.trim(), set: !$("#mvSetWrap").hidden && $("#f_mvSet").checked } : null;
  const token = $("#f_token").value.trim();
  if (!token) { $("#f_token").focus(); return tdbErr("Masukkan kode akses edit."); }
  const btn = $("#tdbSave"); btn.disabled = true; btn.textContent = "Menyimpan…";
  try {
    const baFile = move && $("#f_mvFile").files[0];
    if (baFile) {
      btn.textContent = "Mengunggah BA…";
      const u = await baUpload(baFile, r.gi, loc.gi, token, r);
      move.ba = baJoin(move.ba, u.url);
      btn.textContent = "Menyimpan…";
    }
    const res = await fetch(TDB_API, { method: "POST", body: JSON.stringify({ token, action: r ? "update" : "add", row: r && r._row, expect: r && r.komponen, data, move }) });
    const j = await res.json();
    if (!j.ok) {
      if (j.code === "auth") { tokenForget(true); }
      throw new Error(j.error || "Gagal menyimpan");
    }
    tokenSave(token);
    tdbCloseForm();
    if (j.moved) {
      await tdbLoad(); // muat ulang: lokasi beberapa komponen & riwayat berubah
      toast(`Lokasi dipindah & riwayat tercatat (${j.moved} komponen)`);
    } else {
      if (r) Object.assign(r, j.row || data); else TDB.rows.push(j.row);
      renderTrafoDb();
      toast(r ? "Perubahan tersimpan ke Google Sheets" : "Komponen baru ditambahkan ke Google Sheets");
    }
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
    `<section class="dsec ph-sec" id="phSec"></section>` +
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
    sec("Riwayat perpindahan", mvTimeline(r), "rotate");
  $("#tdbDetail").showModal();
  phOpen(r, false);
}
function tdbCloseDetail() { $("#tdbDetail").close(); }

/* =========================================================
   FOTO KOMPONEN (Google Drive via Apps Script)
   ========================================================= */
/* Mode: edit = true di form Edit komponen (kelola foto), false di pop-up Detail (lihat saja) */
const PH = { r: null, list: [], loading: false, busy: "", err: "", editCap: null, view: 0, needToken: false, tok: "", edit: false };
const PH_MAX_SIDE = 1920, PH_QUALITY = .85, PH_MAX_FILES = 10;
const phCan = r => !!TDB_API && TDB.live && !!(r && r._row);
function phOpen(r, edit) {
  PH.r = r; PH.edit = !!edit; PH.list = []; PH.err = ""; PH.busy = ""; PH.editCap = null; PH.needToken = false; PH.tok = "";
  if (!phCan(r)) { PH.loading = false; phRender(); return; }
  phLoad();
}
async function phLoad() {
  const r = PH.r; PH.loading = true; phRender();
  try {
    const u = `${TDB_API}?action=photos&row=${encodeURIComponent(r._row)}&expect=${encodeURIComponent(r.komponen || "")}`;
    const j = await (await fetch(u, { cache: "no-store" })).json();
    if (PH.r !== r) return;
    if (!j.ok) throw new Error(j.error || "Gagal memuat foto");
    PH.list = j.photos || []; if (j.folder) r.linkFoto = j.folder;
  } catch (e) { if (PH.r === r) PH.err = String(e.message || e); }
  if (PH.r === r) { PH.loading = false; phRender(); }
}
function phRender() {
  const el = $(PH.edit ? "#phSecForm" : "#phSec"); if (!el) return;
  const r = PH.r, can = phCan(r), n = PH.list.length, ed = PH.edit && can;
  const head = `<div class="ph-head"><h4>${icon("camera", "ic xs")}Foto komponen${n ? ` <small>${n}</small>` : ""}</h4>
    ${ed ? `<label class="btn primary sm${PH.busy ? " disabled" : ""}"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Tambah foto
      <input type="file" accept="image/*" multiple hidden ${PH.busy ? "disabled" : ""} onchange="phUpload(this.files); this.value=''"></label>` : ""}</div>`;
  let body;
  if (!can) {
    body = `<p class="dnil">${!TDB_API ? "Hubungkan Google Sheets untuk melihat dan mengelola foto." : !TDB.live ? "Data belum termuat dari Google Sheets — muat ulang halaman untuk melihat foto." : "Simpan komponen baru ini terlebih dahulu, lalu buka <b>Edit</b> lagi untuk menambahkan foto."}
      ${r && tdbUrl(r.linkFoto) ? ` <a href="${esc(r.linkFoto)}" target="_blank" rel="noopener">Buka folder foto</a>` : ""}</p>`;
  } else if (PH.loading) {
    body = `<div class="ph-grid">${"<div class='ph-tile sk'></div>".repeat(3)}</div>`;
  } else if (!n && !ed) {
    body = `<p class="dnil">Belum ada foto. Foto dapat ditambahkan lewat <button type="button" class="linkbtn" onclick="tdbDetailEdit()">Edit komponen</button>.</p>`;
  } else if (!n) {
    body = `<label class="ph-empty">${icon("camera")}<b>Belum ada foto</b><span>Klik untuk memilih foto (bisa beberapa sekaligus, maks. ${PH_MAX_FILES} per unggahan).</span>
      <input type="file" accept="image/*" multiple hidden ${PH.busy ? "disabled" : ""} onchange="phUpload(this.files); this.value=''"></label>`;
  } else {
    body = `<div class="ph-grid">${PH.list.map((p, i) => `<figure class="ph-tile">
      <button type="button" class="ph-img" onclick="phView(${i})" aria-label="Perbesar foto ${i + 1}">
        <img src="${esc(p.thumb)}" alt="${esc(p.caption || p.name)}" loading="lazy" onerror="this.closest('.ph-img').classList.add('broken')">
        <span class="ph-broken">Foto tidak dapat ditampilkan.<br>Periksa izin berbagi folder Drive.</span></button>
      <figcaption>${!ed ? `<span class="ph-cap${p.caption ? "" : " nil"}">${esc(p.caption || "Tanpa keterangan")}</span>` : PH.editCap === p.id
        ? `<input type="text" id="phCapInput" value="${esc(p.caption)}" maxlength="500" placeholder="Keterangan foto" onkeydown="if(event.key==='Enter'){event.preventDefault();phSaveCaption('${esc(p.id)}')}if(event.key==='Escape'){event.stopPropagation();PH.editCap=null;phRender()}">
           <div class="ph-act"><button type="button" class="linkbtn" onclick="phSaveCaption('${esc(p.id)}')">Simpan</button><button type="button" class="linkbtn muted" onclick="PH.editCap=null;phRender()">Batal</button></div>`
        : `<span class="ph-cap${p.caption ? "" : " nil"}">${esc(p.caption || "Tanpa keterangan")}</span>
           <div class="ph-act">
             <label class="linkbtn${PH.busy ? " disabled" : ""}">Ganti<input type="file" accept="image/*" hidden ${PH.busy ? "disabled" : ""} onchange="phReplace('${esc(p.id)}', this.files[0]); this.value=''"></label>
             <button type="button" class="linkbtn" ${PH.busy ? "disabled" : ""} onclick="PH.editCap='${esc(p.id)}';phRender();setTimeout(()=>$('#phCapInput')?.focus(),20)">Keterangan</button>
             <button type="button" class="linkbtn danger" ${PH.busy ? "disabled" : ""} onclick="phDelete('${esc(p.id)}')">Hapus</button></div>`}
      </figcaption></figure>`).join("")}</div>`;
  }
  const tokenField = false
    ? `<label class="fld ph-token"><span>Kode akses edit <small>(diperlukan untuk mengunggah/mengubah foto)</small></span><input type="password" id="phToken" placeholder="Kode dari admin" autocomplete="current-password" value="${esc(PH.tok)}" oninput="PH.tok=this.value.trim()"></label>` : "";
  el.innerHTML = head + body +
    (PH.busy ? `<p class="ph-status"><i class="spin"></i>${esc(PH.busy)}</p>` : "") +
    (PH.err ? `<p class="form-err ph-err" role="alert">${esc(PH.err)}</p>` : "") + tokenField +
    (ed ? `<p class="ph-foot">Perubahan foto langsung tersimpan ke Google Drive (tidak perlu menekan Simpan).</p>` : "") +
    (can && r.linkFoto && tdbUrl(r.linkFoto) ? `<p class="ph-foot">Disimpan di Google Drive · <a href="${esc(r.linkFoto)}" target="_blank" rel="noopener">Buka folder foto komponen</a></p>` : "");
}
/* Kode akses: yang tersimpan di perangkat, atau yang diketik di kolom kode akses form Edit */
function phToken() {
  PH.tok = ($("#f_token") && $("#f_token").value.trim()) || "";
  const t = tokenGet() || PH.tok;
  if (!t) {
    PH.needToken = true; PH.err = "Masukkan kode akses edit di bagian bawah form untuk mengelola foto."; phRender();
    setTimeout(() => $("#f_token")?.focus(), 20);
  }
  return t;
}
async function phPost(action, payload) {
  const r = PH.r, token = phToken(); if (!token) return null;
  const res = await fetch(TDB_API, { method: "POST", body: JSON.stringify({ token, action, row: r._row, expect: r.komponen, ...payload }) });
  const j = await res.json();
  if (!j.ok) {
    if (j.code === "auth") { tokenForget(true); PH.needToken = true; PH.tok = ""; }
    throw new Error(j.error || "Gagal menyimpan foto");
  }
  tokenSave(token); PH.needToken = false; PH.tok = "";
  if ($("#tdbDialog").open) tdbTokenUi();
  if (j.folder) r.linkFoto = j.folder;
  return j;
}
/* Perkecil foto di browser (maks. 1920 px, JPEG 85%) sebelum diunggah */
async function phPrepare(file) {
  if (!/^image\//.test(file.type)) throw new Error(`"${file.name}" bukan file gambar.`);
  let bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation: "from-image" }); }
  catch (e) { throw new Error(`"${file.name}" tidak dapat dibaca. Gunakan format JPG atau PNG.`); }
  const k = Math.min(1, PH_MAX_SIDE / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height); bmp.close && bmp.close();
  const blob = await new Promise(res => c.toBlob(res, "image/jpeg", PH_QUALITY));
  const data = await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(",")[1]); fr.onerror = rej; fr.readAsDataURL(blob); });
  return { name: file.name.replace(/\.[^.]+$/, "") + ".jpg", mime: "image/jpeg", data };
}
async function phUpload(files) {
  files = [...(files || [])]; if (!files.length || PH.busy) return;
  if (files.length > PH_MAX_FILES) { PH.err = `Maksimal ${PH_MAX_FILES} foto per unggahan.`; return phRender(); }
  if (!phToken()) return;
  const r = PH.r; PH.err = ""; let ok = 0; const fails = [];
  for (let i = 0; i < files.length; i++) {
    PH.busy = `Mengunggah foto ${i + 1} dari ${files.length}…`; phRender();
    try {
      const j = await phPost("photo_upload", await phPrepare(files[i]));
      if (!j) break;
      if (PH.r === r) PH.list.push(j.photo); ok++;
    } catch (e) { fails.push(String(e.message || e)); if (PH.needToken) break; }
  }
  PH.busy = ""; if (fails.length) PH.err = fails.join(" · ");
  phRender(); if (ok) toast(`${ok} foto berhasil diunggah ke Google Drive`);
}
async function phReplace(id, file) {
  if (!file || PH.busy || !phToken()) return;
  PH.err = ""; PH.busy = "Memperbarui foto…"; phRender();
  try {
    const j = await phPost("photo_replace", { fileId: id, ...(await phPrepare(file)) });
    if (j) { const i = PH.list.findIndex(p => p.id === id); if (i >= 0) PH.list[i] = j.photo; toast("Foto berhasil diperbarui"); }
  } catch (e) { PH.err = String(e.message || e); }
  PH.busy = ""; phRender();
}
async function phSaveCaption(id) {
  const v = ($("#phCapInput")?.value || "").trim();
  if (!phToken()) return;
  PH.err = ""; PH.busy = "Menyimpan keterangan…"; phRender();
  try {
    const j = await phPost("photo_caption", { fileId: id, caption: v });
    if (j) { const p = PH.list.find(x => x.id === id); if (p) p.caption = v; PH.editCap = null; toast("Keterangan foto tersimpan"); }
  } catch (e) { PH.err = String(e.message || e); }
  PH.busy = ""; phRender();
}
async function phDelete(id) {
  if (PH.busy || !confirm("Hapus foto ini? Foto akan dipindahkan ke Sampah Google Drive dan masih bisa dipulihkan.")) return;
  if (!phToken()) return;
  PH.err = ""; PH.busy = "Menghapus foto…"; phRender();
  try {
    const j = await phPost("photo_delete", { fileId: id });
    if (j) { PH.list = PH.list.filter(p => p.id !== id); toast("Foto dihapus"); }
  } catch (e) { PH.err = String(e.message || e); }
  PH.busy = ""; phRender();
}
/* =========================================================
   RIWAYAT PERPINDAHAN
   ========================================================= */
const fmtD = d => { const m = String(d || "").match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}-${m[2]}-${m[1]}` : (d || "—"); };
const tdbMovesOf = r => (TDB.moves || []).filter(m => r && r.id && m.kompId === r.id).sort((a, b) => (a.tanggal || "") < (b.tanggal || "") ? -1 : 1);
function mvTimeline(r, editable) {
  const ms = tdbMovesOf(r);
  const legacy = (r.riwayat || []).filter(x => x.lokasi || x.ba);
  const items = ms.map(m => `<li class="mv-item">
      <span class="mv-dot"></span>
      <div class="mv-body"><div class="mv-date">${esc(fmtD(m.tanggal))}${m.sumber ? ` <small>${esc(m.sumber)}</small>` : ""}</div>
        <div class="mv-route"><span>${esc(m.dariGi || "—")}${m.dariUpt ? ` <small>${esc(m.dariUpt)}</small>` : ""}</span><b>→</b><span>${esc(m.keGi || "—")}${m.keUpt ? ` <small>${esc(m.keUpt)}</small>` : ""}</span></div>
        ${m.alasan ? `<p>${esc(m.alasan)}</p>` : ""}${m.ba ? `<p class="mv-ba">BA: ${baHtml(m.ba)}</p>` : ""}
        ${editable ? `<button type="button" class="linkbtn danger" onclick="mvDelete('${esc(m.id)}')" ${MV.busy ? "disabled" : ""}>Hapus</button>` : ""}</div></li>`).join("");
  const now = `<li class="mv-item now"><span class="mv-dot"></span><div class="mv-body"><div class="mv-date">Saat ini</div>
      <div class="mv-route"><span><b>${esc(r.gi || "—")}</b> <small>${esc(r.upt || "")}</small></span></div></div></li>`;
  const leg = legacy.length ? `<div class="mv-legacy"><b>Riwayat tahunan (kolom 2020–2025)</b>${legacy.map(x => `<div>${x.tahun}: ${esc(x.lokasi || "—")}${x.ba ? ` · ${tdbLink(x.ba, "BA")}` : ""}</div>`).join("")}</div>` : "";
  if (!ms.length && !legacy.length) return `<ul class="mv-tl">${now}</ul><p class="dnil">Belum ada riwayat perpindahan tercatat. Perpindahan tercatat otomatis saat lokasi penempatan diubah lewat <b>Edit komponen</b>${editable ? ", atau tambahkan riwayat lama di bawah" : ""}.</p>`;
  return `<ul class="mv-tl">${items}${now}</ul>${leg}`;
}
const MV = { adding: false, busy: false, err: "" };
function mvRender() {
  const el = $("#mvSecForm"); if (!el) return;
  const r = TDB.editing;
  if (!r || !r._row || !phCan(r)) { el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = `<div class="ph-head"><h4>${icon("rotate", "ic xs")}Riwayat perpindahan</h4>
      ${MV.adding ? "" : `<button type="button" class="btn ghost sm" onclick="mvStartAdd()">${icon("rotate", "ic xs")}Tambah riwayat lama</button>`}</div>
    ${mvTimeline(r, true)}
    ${MV.adding ? `<div class="fld-group mv-add">
        <div class="fld-group-h">Tambah riwayat perpindahan <small>untuk perpindahan yang terjadi sebelum dicatat di dashboard</small></div>
        <label class="fld"><span>Tanggal pindah <em>*</em></span><input type="date" id="mv_date"></label>
        <label class="fld"><span>No. BA</span><input type="text" id="mv_ba" placeholder="Nomor berita acara (opsional)" autocomplete="off"></label>
        <label class="fld wide"><span>Dokumen BA <small>PDF / JPG / PNG / DOC, maks. 15 MB</small></span><input type="file" id="mv_file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,application/pdf,image/jpeg,image/png"></label>
        <div class="fld-group-h sub">Dari</div>${locPickerHtml("mvf", false)}
        <div class="fld-group-h sub">Ke</div>${locPickerHtml("mvt", false)}
        <label class="fld wide"><span>Alasan / keterangan</span><input type="text" id="mv_alasan" autocomplete="off"></label>
        <div class="mv-add-btns wide"><button type="button" class="btn ghost sm" onclick="MV.adding=false;MV.err='';mvRender()">Batal</button>
          <button type="button" class="btn primary sm" id="mvSaveBtn" onclick="mvSave()">Simpan riwayat</button></div></div>` : ""}
    <p class="form-err ph-err" id="mvErr" role="alert" ${MV.err ? "" : "hidden"}>${esc(MV.err)}</p>
    <p class="ph-foot">Riwayat langsung tersimpan ke sheet RIWAYAT LOKASI (tidak perlu menekan Simpan).</p>`;
  if (MV.adding) { locFill("mvf", "", ""); locFill("mvt", "", ""); }
}
function mvStartAdd() { MV.adding = true; MV.err = ""; mvRender(); setTimeout(() => $("#mv_date")?.focus(), 20); }
/* Status form riwayat tanpa menggambar ulang (isian & file pilihan tetap) */
function mvStatus(busyText, err) {
  const b = $("#mvSaveBtn"); if (b) { b.disabled = !!busyText; b.textContent = busyText || "Simpan riwayat"; }
  MV.err = err || ""; const e = $("#mvErr"); if (e) { e.hidden = !MV.err; e.textContent = MV.err; }
}
const mvTok = () => tokenGet() || ($("#f_token") && $("#f_token").value.trim()) || "";
async function mvPost(action, payload) {
  const r = TDB.editing, token = mvTok();
  if (!token) { mvStatus("", "Masukkan kode akses edit di bagian bawah form."); $("#f_token")?.focus(); return null; }
  MV.busy = true; mvStatus("Menyimpan…");
  try {
    const j = await (await fetch(TDB_API, { method: "POST", body: JSON.stringify({ token, action, row: r._row, expect: r.komponen, ...payload }) })).json();
    if (!j.ok) { if (j.code === "auth") tokenForget(true); throw new Error(j.error || "Gagal menyimpan riwayat"); }
    tokenSave(token); if ($("#tdbDialog").open) tdbTokenUi();
    TDB.moves = j.moves || TDB.moves;
    mvStatus("");
    return j;
  } catch (e) { mvStatus("", String(e.message || e)); return null; }
  finally { MV.busy = false; }
}
async function mvSave() {
  if (MV.busy) return;
  const d = $("#mv_date").value, from = locGet("mvf"), to = locGet("mvt");
  if (!d) return mvStatus("", "Isi tanggal pindah.");
  if (!to.gi && !to.upt) return mvStatus("", "Isi lokasi tujuan (Ke).");
  let ba = $("#mv_ba").value.trim();
  const file = $("#mv_file").files[0];
  if (file) {
    const token = mvTok();
    if (!token) { mvStatus("", "Masukkan kode akses edit di bagian bawah form."); $("#f_token")?.focus(); return; }
    MV.busy = true; mvStatus("Mengunggah BA…");
    try { ba = baJoin(ba, (await baUpload(file, from.gi, to.gi, token, TDB.editing)).url); }
    catch (e) { MV.busy = false; return mvStatus("", String(e.message || e)); }
    MV.busy = false;
  }
  const j = await mvPost("move_add", { move: { tanggal: d, dariUpt: from.upt, dariGi: from.gi, keUpt: to.upt, keGi: to.gi, alasan: $("#mv_alasan").value.trim(), ba } });
  if (j) { MV.adding = false; MV.err = ""; mvRender(); renderTrafoDb(); toast(file ? "Riwayat & dokumen BA tersimpan" : "Riwayat perpindahan tersimpan"); }
}

/* ---------- Dokumen BA mobilisasi (Google Drive) ---------- */
const BA_TYPES = { pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
const BA_MAX = 15 * 1024 * 1024;
const BA_CACHE = {}; // hindari unggah ulang file yang sama bila penyimpanan riwayat gagal lalu dicoba lagi
const baJoin = (no, url) => [String(no || "").trim(), url].filter(Boolean).join(" · ");
function baHtml(v) {
  return String(v).split(/(https?:\/\/[^\s·]+)/).map((p, i) => i % 2
    ? `<a class="btn ghost sm" href="${esc(p)}" target="_blank" rel="noopener">Buka dokumen BA <svg viewBox="0 0 24 24"><path d="M7 17 17 7M9 7h8v8"/></svg></a>`
    : esc(p).replace(/^\s*·\s*|\s*·\s*$/g, "")).join(" ");
}
async function baUpload(file, dariGi, keGi, token, r) {
  const mime = BA_TYPES[(file.name.split(".").pop() || "").toLowerCase()];
  if (!mime) throw new Error("Format dokumen BA harus PDF, JPG, PNG, DOC, atau DOCX.");
  if (file.size > BA_MAX) throw new Error("Ukuran dokumen BA melebihi 15 MB.");
  const key = [file.name, file.size, file.lastModified, dariGi, keGi].join("|");
  if (BA_CACHE[key]) return BA_CACHE[key];
  const data = await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(",")[1]); fr.onerror = rej; fr.readAsDataURL(file); });
  const j = await (await fetch(TDB_API, { method: "POST", body: JSON.stringify({ token, action: "ba_upload", row: r._row, expect: r.komponen, name: file.name, mime, data, dariGi, keGi }) })).json();
  if (!j.ok) { if (j.code === "auth") tokenForget(true); throw new Error(j.error || "Gagal mengunggah dokumen BA"); }
  tokenSave(token);
  return (BA_CACHE[key] = j);
}
async function mvDelete(id) {
  if (!confirm("Hapus riwayat perpindahan ini dari sheet RIWAYAT LOKASI?")) return;
  const j = await mvPost("move_delete", { moveId: id });
  mvRender(); if (j) { renderTrafoDb(); toast("Riwayat dihapus"); }
}

/* Penampil foto besar */
function phView(i) {
  if (!PH.list.length) return;
  PH.view = (i + PH.list.length) % PH.list.length;
  const p = PH.list[PH.view];
  $("#phViewImg").src = p.full; $("#phViewImg").alt = p.caption || p.name;
  $("#phViewCap").textContent = p.caption || p.name;
  $("#phViewCount").textContent = `${PH.view + 1} / ${PH.list.length}`;
  $("#phViewOpen").href = p.view;
  $("#phViewer").querySelectorAll(".pv-nav").forEach(b => b.hidden = PH.list.length < 2);
  if (!$("#phViewer").open) $("#phViewer").showModal();
}
function tdbDetailEdit() { const i = TDB.detail; tdbCloseDetail(); tdbOpenForm(i); }

function initTrafoDb() {
  if (!$("#page-trafodb")) return;
  tdbBuildForm();
  $("#tdbSearch").addEventListener("input", () => tdbFilter());
  $("#tdbLoc").addEventListener("change", () => tdbFilter());
  $("#tdbLocPanel").addEventListener("click", tdbPanelClick);
  $("#tdbMapTools").addEventListener("click", e => { const b = e.target.closest("[data-area]"); if (b) { tdbSelectLoc(null); tdbFit(b.dataset.area === "all" ? null : b.dataset.area); } });
  $("#tdbPager").addEventListener("click", e => { const b = e.target.closest("button[data-p]"); if (b && !b.disabled) tdbGoPage(+b.dataset.p); });
  $("#tdbStatus").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    $("#tdbStatus").querySelectorAll("button").forEach(x => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b); });
    tdbFilter();
  });
  $("#tdbForm").addEventListener("submit", tdbSubmit);
  $("#tdbDialog").addEventListener("click", e => { if (e.target === $("#tdbDialog")) tdbCloseForm(); });
  $("#tdbDetail").addEventListener("click", e => { if (e.target === $("#tdbDetail")) tdbCloseDetail(); });
  ["#tdbDetail", "#tdbDialog"].forEach(d => $(d).addEventListener("cancel", e => { if (PH.editCap) { e.preventDefault(); PH.editCap = null; phRender(); } }));
  $("#phViewer").addEventListener("click", e => { if (e.target === $("#phViewer")) $("#phViewer").close(); });
  $("#phViewer").addEventListener("keydown", e => { if (e.key === "ArrowLeft") phView(PH.view - 1); if (e.key === "ArrowRight") phView(PH.view + 1); });
  renderTrafoDb();
  tdbLoad();
}
initTrafoDb();

/* =========================================================
   NAVIGATION (hash routing: bisa di-bookmark & tombol back)
   ========================================================= */
const PAGES = {
  health: ["Kondisi Aset", "Health Index", "Sebaran prioritas temuan aset Jaringan dan Gardu Induk"],
  jar: ["Kondisi Aset", "Asesmen JAR", "Health index aset jaringan per UPT"],
  gi: ["Kondisi Aset", "Asesmen GI", "Health index aset gardu induk per UPT"],
  cui: ["Inspeksi Transmisi", "CUI Jarvis", "Hasil Climb Up Inspection tower transmisi dari Jarvis"],
  tower: ["Peralatan ERS", "Tower Emergency", "Ketersediaan & inventaris tower emergency (ERS)"],
  trafodb: ["Peralatan ERS", "Trafo Mobile", "Kumpulan data trafo mobile per trailer"],
  dcm: ["Peralatan ERS", "DC Mobile", "Data unit DC mobile (sistem DC bergerak) UIT JBM"],
  alat: ["Alat Berat & Alat Bantu", "Alat Berat", "Database Kesiapan Alat Berat UIT JBM"],
  fm: ["Alat Berat & Alat Bantu", "Filter Minyak", "Data unit filter minyak trafo UIT JBM"]
};
/* Tanggal "Diperbarui" di topbar: halaman boleh mendaftarkan tanggalnya sendiri lewat window.PAGE_UPDATED[id]() */
const UPDATED_DEFAULT = "3 Okt 2026";
const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
function fmtTanggal(d) {
  const m = String(d || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${+m[3]} ${BULAN[+m[2] - 1]} ${m[1]}` : String(d || "");
}
function setUpdated(id) {
  id = id || (location.hash.slice(1) || "");
  const fn = window.PAGE_UPDATED && window.PAGE_UPDATED[id];
  const v = fn ? fn() : null;
  const el = document.querySelector(".chip.updated");
  if (el) {
    el.innerHTML = `<i class="live-dot"></i>Diperbarui ${v ? (v.text || fmtTanggal(v.date)) : UPDATED_DEFAULT}`;
    el.title = v && v.title ? v.title : "";
  }
}
function route() {
  if (location.hash === "#trafo") { location.replace("#trafodb"); return; } // halaman lama Trafo Mobile dihapus
  const id = PAGES[location.hash.slice(1)] ? location.hash.slice(1) : "health"; // halaman awal (Kinerja & Optimalisasi PDKB dihapus)
  document.querySelectorAll(".page").forEach(p => p.classList.toggle("active", p.id === "page-" + id));
  document.querySelectorAll(".nav-item").forEach(n => {
    const on = n.dataset.page === id;
    n.classList.toggle("active", on);
    on ? n.setAttribute("aria-current", "page") : n.removeAttribute("aria-current");
  });
  const [g, t, s] = PAGES[id];
  $("#pageGroup").textContent = g; $("#pageTitle").textContent = t; $("#pageSub").textContent = s;
  document.title = `${t} · Dashboard FASHAR UIT JBM`;
  setUpdated(id);
  closeDrawer();
  window.scrollTo({ top: 0 });
  if (id === "trafodb") setTimeout(tdbMapResize, 60);
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
  if (TDB_MAP.map) tdbTiles();
  if (window.abMapTheme) window.abMapTheme();
  (window.ALAT_MAP_THEMES || []).forEach(f => f());
}
