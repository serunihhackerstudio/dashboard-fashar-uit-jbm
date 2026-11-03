/* =========================================================
   Dashboard FASHAR UIT JBM — prototype (data statis / mock)
   ========================================================= */

/* ---------- Helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const nf = new Intl.NumberFormat("id-ID");
const nf1 = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmt = v => nf.format(v);
const fmt1 = v => nf1.format(v);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const title = s => s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

const C = {
  gi: "var(--c-gi)", jar: "var(--c-jar)", green: "var(--c-green)", red: "var(--c-red)",
  amber: "var(--c-amber)", violet: "var(--c-violet)", teal: "var(--c-teal)", blue: "var(--c-blue)"
};

/* ---------- Ikon (stroke, 24x24) ---------- */
const I = {
  chart: '<path d="M4 19V9M10 19V5M16 19v-7M21 19H3"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/><path d="M3.5 12h4l2-3 3 6 2-3h6"/>',
  line: '<path d="M12 2 7 22M12 2l5 20M8.5 8h7M7.5 13h9M6.5 18h11"/>',
  building: '<path d="M4 21h16M6 21V8h12v13M9 8V4h6v4M9 12h2M13 12h2M9 16h2M13 16h2"/>',
  tower: '<path d="M12 2v20M5 22l7-20 7 20M7 15h10M9 9h6"/>',
  truck: '<path d="M2 7h11v9H2zM13 10h4l4 3v3h-8"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  pin: '<path d="M12 21s-7-5.2-7-11a7 7 0 1 1 14 0c0 5.8-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  doc: '<path d="M14 3H6v18h12V7Z"/><path d="M14 3v4h4M9 12h6M9 16h4"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  alert: '<path d="M12 3 2 21h20L12 3Z"/><path d="M12 10v5M12 18h.01"/>',
  swap: '<path d="M7 7h13l-3-3M17 17H4l3 3"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5Z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"/>',
  sort: '<path d="m7 15 5 5 5-5M7 9l5-5 5 5"/>'
};
const icon = (name, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[name]}</svg>`;

/* ---------- Data (mock) ---------- */
const UNITS = ["SURABAYA", "GRESIK", "MALANG", "MADIUN", "PROBOLINGGO", "BALI"];

const KINERJA = {
  optimGI: 120.8, optimJAR: 115.3,
  gi: {
    "Preventive Action": [100, 94, 90, 87, 92, 98],
    "Corrective Action": [96, 88, 72, 95, 91, 70],
    "Program Keandalan": [100, 83, 104, 88, 92, 90]
  },
  jar: {
    "Preventive Action": [105, 96, 92, 78, 87, 95],
    "Corrective Action": [95, 120, 70, 84, 46, 100],
    "Program Keandalan": [98, 92, 99, 101, 75, 90]
  },
  cert: [["Level 2 JAR", 48, 78], ["Level 2 GI", 50, 82], ["Level 3 JAR", 47, 79], ["Level 3 GI", 40, 66], ["Level 4", 25, 42], ["Level 5", 6, 15]]
};

const OPTIM_UPT = [
  ["SURABAYA", 108.7, 122.8], ["MADIUN", 108.7, 114.2], ["GRESIK", 116.5, 129.5],
  ["PROBOLINGGO", 124.1, 96.8], ["MALANG", 126.0, 112.0], ["BALI", 122.1, 116.8]
];
const REALISASI = [
  ["Preventive Action", 755, 2533],
  ["Corrective Action", 270, 227],
  ["Program Keandalan Transmisi", 492, 1094]
];

const CATS = ["Isolator", "Accessories Cold", "Accessories Hot", "Accessories GSW"];
const HEALTH = {
  jar: [[207, 807, 16059], [222, 1098, 8049], [471, 1976, 10563], [415, 1027, 4229]],
  gi: [[47, 437, 2502], [9, 107, 1675], [97, 462, 1914], [81, 386, 1846]]
};

/* Asesmen per UPT: total per kategori (mock), dipecah ke P1/P2/P3 */
function assessData(seed) {
  const totals = [120, 620, 1500, 2800];
  const split = [[.06, .22], [.04, .18], [.08, .25], [.03, .15]];
  return UNITS.map((u, i) => ({
    unit: u,
    rows: CATS.map((c, j) => {
      const k = (i + j + seed) % 4;
      const t = totals[k], p1 = Math.round(t * split[k][0]), p2 = Math.round(t * split[k][1]);
      return { cat: c, p: [p1, p2, t - p1 - p2] };
    })
  }));
}

const TOWER_KPI = { total: 18, dipinjam: 9, lengkap: 3, tidakLengkap: 6 };
const MATERIALS = {
  "Lindsey": [["Post Insulator Support", 3], ["Tower Gimbal", 8], ["4-Way Guy Plate", 19], ["Guy Plate", 17], ["Overhead Ground Wire Bracket", 3], ["Anchor Bracket (Mock)", 12], ["Cross Arm Support (Mock)", 7], ["Insulator Clamp (Mock)", 21], ["Guy Wire Fitting (Mock)", 14], ["Structure Connector (Mock)", 9]],
  "Tower Solution": [["Transfer Rod", 324], ["Tower Section", 72], ["Base Pivot", 15], ["Bolt Assembly", 498], ["Universal Attachment", 30], ["Extension Mast (Mock)", 18], ["Support Bracket (Mock)", 42], ["Pivot Connector (Mock)", 24], ["Guy Assembly (Mock)", 36], ["Foundation Plate (Mock)", 11]],
  "SBB": [["Mast Section", 22], ["Universal Bracket", 27], ["Line Post Insulator Bracket", 6], ["Bolt 3/4", 180], ["Hex Nut 3/4", 374], ["Diagonal Brace (Mock)", 34], ["Base Plate (Mock)", 16], ["Lock Washer 3/4 (Mock)", 210], ["Connecting Plate (Mock)", 28], ["Support Clamp (Mock)", 13]]
};

const TRAFO_KPI = { total: 8, operasi: 4, dipinjam: 2, rusak: 2 };
const TRAFO_LINK = "https://bit.ly/trafo-mobile-uit-jbm";
const TRAFO_UPT = [
  { title: "UPT Malang", status: "Berbeban", tone: "green", lokasi: "GI 150 kV Ngoro", ket: "Perkuatan GI Ngoro (pertumbuhan beban)", unit: "CG Pauwels — 30 MVA", rencana: "Extension trafo AI 2024, rencana onsite 2027", alat: "Trafo, MTU, Kubikel, Kontrol" },
  { title: "UPT Probolinggo", status: "Standby", tone: "blue", lokasi: "GISTET 500 kV Paiton", ket: "Perkuatan trafo TFT karena hanya 1 bay trafo", unit: "CG Pauwels — 30 MVA", rencana: "Rencana perbaikan 2026", alat: "Trafo, MTU, Kubikel, Kontrol" },
  { title: "UPT Bali", status: "Berbeban", tone: "green", lokasi: "GI 150 kV Gianyar", ket: "Perkuatan GI Ngoro (pertumbuhan beban)", unit: "CG Pauwels — 30 MVA", rencana: "Belum ada extension trafo karena terkendala pembebasan lahan", alat: "Trafo, MTU, Kubikel" },
  { title: "UPT Madiun", status: "Berbeban", tone: "green", lokasi: "GI 150 kV New Tulungagung", ket: "Perkuatan GI New Tul (pertumbuhan beban)", unit: "CG Pauwels — 30 MVA", rencana: "Hanya 1 trafo", alat: "Trafo, MTU, Kubikel, Kontrol" }
];
const TRAFO_OTHER = [
  { title: "IKN", status: "Dipinjam", tone: "amber", lokasi: "IKN", ket: "Pendukung pembangunan IKN", unit: "CG Pauwels — 30 MVA", rencana: "—", alat: "Trafo, MTU, Kubikel, Kontrol" },
  { title: "GI 150 kV Garuda Sakti", status: "Dipinjam", tone: "amber", lokasi: "GI 150 kV Garuda Sakti", ket: "Program High Quality Growth 2024", unit: "Fuji Electric — 20 MVA", rencana: "—", alat: "Trafo, MTU, Kubikel" },
  { title: "UPT Gresik", status: "Rusak", tone: "red", lokasi: "GIS 150 kV Tandes", ket: "Kondisi tidak layak operasi / rusak berat", unit: "ABB", rencana: "Rencana ATTB", alat: "MTU, Kubikel" },
  { title: "UPT Surabaya", status: "Rusak", tone: "red", lokasi: "GI 150 kV Kalisari", ket: "Hasil uji buruk pada belitan HV to Ground, OLTC rusak dan hasil uji winding buruk", unit: "ABB — 30 MVA", rencana: "Rencana ATTB", alat: "Trafo, MTU, Kubikel" }
];

/* ---------- Komponen ---------- */
const card = (head, body, cls = "") => `<section class="card ${cls}">${head}<div class="card-b">${body}</div></section>`;
const cardHead = (t, { dot, ico, meta = "", sub = "" } = {}) =>
  `<header class="card-h">
     ${ico ? `<span class="h-ico" style="--tone:${dot}">${icon(ico)}</span>` : dot ? `<i class="h-dot" style="background:${dot}"></i>` : ""}
     <div class="h-txt"><h3>${t}</h3>${sub ? `<p>${sub}</p>` : ""}</div>${meta}
   </header>`;
const sectionTitle = (t, sub = "", right = "") =>
  `<div class="sec-title"><div><h2>${t}</h2>${sub ? `<p>${sub}</p>` : ""}</div>${right}</div>`;
const legend = items => `<div class="legend">${items.map(([l, c]) => `<span><i style="background:${c}"></i>${l}</span>`).join("")}</div>`;

function gauge(v, { max = 115, color, label, size = "lg" }) {
  const p = Math.max(0, Math.min(v / max, 1)) * 100;
  return `<figure class="gauge gauge-${size}" role="img" aria-label="${esc(label)}: ${fmt1(v)} persen">
    <svg viewBox="0 0 200 110" aria-hidden="true">
      <path class="g-track" d="M14 100A86 86 0 0 1 186 100" pathLength="100"/>
      <path class="g-fill" d="M14 100A86 86 0 0 1 186 100" pathLength="100" style="stroke:${color};--p:${p.toFixed(2)}"/>
    </svg>
    <div class="g-center"><div class="g-value">${fmt1(v)}<small>%</small></div><div class="g-label">${label}</div></div>
    <div class="g-scale"><span>0</span><span>${max}</span></div>
  </figure>`;
}

function barList(rows, color, { target = 100 } = {}) {
  const max = Math.max(target, ...rows.map(r => r[1])) * 1.06;
  return `<div class="bars" style="--target:${(target / max * 100).toFixed(2)}%">
    ${rows.map(([l, v]) => `<div class="bar-row">
      <span class="bar-l" title="${esc(l)}">${l}</span>
      <div class="bar"><div class="bar-f" style="--w:${(v / max * 100).toFixed(2)}%;background:${color}"></div></div>
      <b class="bar-v ${v < 80 ? "low" : ""}">${v}%</b>
    </div>`).join("")}
  </div>`;
}

function stat(label, value, { tone, ico, foot = "" }) {
  return `<div class="stat" style="--tone:${tone}">
    <span class="stat-ico">${icon(ico)}</span>
    <div class="stat-txt"><div class="stat-l">${label}</div><div class="stat-v">${value}</div>${foot ? `<div class="stat-f">${foot}</div>` : ""}</div>
  </div>`;
}

/* Peta skematis Jawa Timur – Bali */
const MAP_PTS = {
  madiun: [92, 128], gresik: [232, 82], surabaya: [258, 96], ngoro: [266, 124], malang: [272, 158],
  tulungagung: [150, 162], probolinggo: [352, 128], paiton: [388, 120], tandes: [246, 88], kalisari: [264, 102], gianyar: [538, 168]
};
function map(pins, { h = 220 } = {}) {
  return `<div class="map" style="--h:${h}px">
   <svg viewBox="0 0 600 240" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Peta persebaran aset">
    <defs><pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0v24" class="map-grid"/></pattern></defs>
    <rect width="600" height="240" fill="url(#grid)"/>
    <path class="land" d="M40 110c20-18 60-26 100-24 40 2 70-8 104-14 22-4 40 6 56 14 24 10 50 6 80 12 30 6 46 20 56 36 6 10-4 24-24 30-34 10-74 8-110 14-40 6-70 22-110 20-40-2-70-16-104-22-30-6-56-14-58-34-1-8 4-14 10-18Z"/>
    <path class="land" d="M262 56c20-8 60-10 92-6 14 2 16 12 2 16-28 6-64 6-90 4-12-1-14-10-4-14Z"/>
    <path class="land" d="M494 150c14-12 40-14 62-6 14 6 18 18 6 26-18 10-44 12-62 4-12-6-14-16-6-24Z"/>
    ${pins.map(p => { const [x, y] = MAP_PTS[p.at]; return `<g class="pin" style="--c:${p.c}"><circle class="pin-pulse" cx="${x}" cy="${y}" r="9"/><circle class="pin-dot" cx="${x}" cy="${y}" r="6"/><title>${esc(p.label)}</title></g>`; }).join("")}
   </svg>
  </div>`;
}

/* ---------- Halaman ---------- */
function pageKinerja() {
  const ersPins = [
    { at: "madiun", c: C.gi, label: "Tower Emergency — Madiun" },
    { at: "surabaya", c: C.blue, label: "Trafo Mobile — Surabaya" },
    { at: "probolinggo", c: C.red, label: "DC Mobile — Probolinggo" },
    { at: "paiton", c: C.violet, label: "Crane 22 Ton — Paiton" }
  ];
  const group = (key, color, label) => Object.entries(KINERJA[key]).map(([t, vals]) =>
    card(cardHead(t, { dot: color, sub: label }), barList(UNITS.map((u, i) => [title(u), vals[i]]), color))).join("");

  return `
  <div class="grid g-hero">
    ${card(cardHead("Optimalisasi PDKB Gardu Induk", { ico: "building", dot: C.gi }), gauge(KINERJA.optimGI, { color: C.gi, label: "Optim PDKB GI" }), "center-b")}
    ${card(cardHead("Optimalisasi PDKB Jaringan", { ico: "line", dot: C.jar }), gauge(KINERJA.optimJAR, { color: C.jar, label: "Optim PDKB JAR" }), "center-b")}
    ${card(cardHead("Persebaran Peralatan ERS", { ico: "pin", dot: C.teal }),
      map(ersPins, { h: 180 }) + legend([["DC Mobile", C.red], ["Tower Emergency", C.gi], ["Trafo Mobile", C.blue], ["Crane 22 Ton", C.violet]]), "span-2-md")}
  </div>

  ${sectionTitle("Gardu Induk", "Realisasi per UPT terhadap target (garis 100%)", legend([["Realisasi", C.gi], ["Target 100%", "var(--muted)"]]))}
  <div class="grid g3">${group("gi", C.gi, "PDKB Gardu Induk")}</div>

  ${sectionTitle("Jaringan", "Realisasi per UPT terhadap target (garis 100%)", legend([["Realisasi", C.jar], ["Target 100%", "var(--muted)"]]))}
  <div class="grid g3">${group("jar", C.jar, "PDKB Jaringan")}</div>

  ${sectionTitle("Sertifikat & Kompetensi PDKB", "Jumlah personel bersertifikat aktif per level")}
  ${card(cardHead("Status sertifikat", { ico: "users", dot: C.violet, meta: legend([["Aktif", C.green], ["Kadaluarsa", C.red]]) }),
    `<div class="cert">${KINERJA.cert.map(([l, n, p]) => `<div class="cert-row">
       <span class="bar-l">${l}</span>
       <div class="bar split"><div class="bar-f" style="--w:${p}%;background:${C.green}"></div><div class="bar-rest" style="background:${C.red}"></div></div>
       <b class="cert-v">${n} <small>aktif · ${p}%</small></b></div>`).join("")}</div>`)}
  `;
}

function pageOptim() {
  const totals = REALISASI.reduce((a, r) => [a[0] + r[1], a[1] + r[2]], [0, 0]);
  return `
  ${sectionTitle("Optimalisasi per UPT", "Persentase optimalisasi PDKB Gardu Induk dan Jaringan", legend([["Gardu Induk", C.gi], ["Jaringan", C.jar]]))}
  <div class="grid g3">
   ${OPTIM_UPT.map(([u, gi, jar]) => card(cardHead("UPT " + title(u), { dot: "var(--primary)" }),
      `<div class="gauge-pair">${gauge(gi, { color: C.gi, label: "PDKB GI", size: "sm" })}${gauge(jar, { color: C.jar, label: "PDKB JAR", size: "sm" })}</div>`)).join("")}
  </div>

  ${sectionTitle("Realisasi PDKB UIT JBM", "Jumlah pekerjaan yang telah direalisasikan")}
  <div class="grid g3">
   ${REALISASI.map(([t, gi, jar]) => card(cardHead(t, { ico: "check", dot: C.green }),
      `<div class="duo">
        <div class="duo-i" style="--tone:${C.gi}"><span>Gardu Induk</span><b>${fmt(gi)}</b></div>
        <div class="duo-i" style="--tone:${C.jar}"><span>Jaringan</span><b>${fmt(jar)}</b></div>
       </div>
       <div class="duo-bar"><i style="flex:${gi};background:${C.gi}"></i><i style="flex:${jar};background:${C.jar}"></i></div>`)).join("")}
  </div>
  <p class="note">Total realisasi: <b>${fmt(totals[0])}</b> pekerjaan Gardu Induk dan <b>${fmt(totals[1])}</b> pekerjaan Jaringan.</p>
  `;
}

function donut(p) {
  const tot = p[0] + p[1] + p[2];
  const a = p[0] / tot * 100, b = a + p[1] / tot * 100;
  return `<div class="donut" style="--a:${a}%;--b:${b}%" role="img" aria-label="Total ${fmt(tot)}: P1 ${fmt(p[0])}, P2 ${fmt(p[1])}, P3 ${fmt(p[2])}">
    <div class="donut-c"><b>${fmt(tot)}</b><span>total</span></div></div>`;
}
function pageHealth() {
  const col = (key, name, sub) => `
    <div class="col">
     ${sectionTitle(name, sub)}
     <div class="grid g2">${CATS.map((c, i) => {
       const p = HEALTH[key][i], tot = p[0] + p[1] + p[2];
       return card(cardHead(c, { dot: "var(--primary)" }),
         `<div class="health">${donut(p)}
           <ul class="prio">${["P1", "P2", "P3"].map((l, k) => `<li class="p${k + 1}"><span><i></i>${l}</span><b>${fmt(p[k])}</b><small>${(p[k] / tot * 100).toFixed(1).replace(".", ",")}%</small></li>`).join("")}</ul>
          </div>`);
     }).join("")}</div>
    </div>`;
  return `
   <div class="callout">${icon("alert")}<div><b>Cara membaca:</b> P1 = prioritas tertinggi (perlu penanganan segera), P2 = sedang, P3 = rendah.</div></div>
   <div class="grid g2 cols">
    ${col("jar", "Asesmen JAR", "PDKB Jaringan")}
    ${col("gi", "Asesmen GI", "PDKB Gardu Induk")}
   </div>`;
}

function pageAssess(seed, label) {
  const data = assessData(seed);
  return `
  ${sectionTitle("Health Index Aset " + label, "Jumlah temuan per kategori, dipecah berdasarkan prioritas",
    legend([["P1", "var(--p1)"], ["P2", "var(--p2)"], ["P3", "var(--p3)"]]))}
  <div class="grid g3">
   ${data.map(d => {
     const max = Math.max(...d.rows.map(r => r.p[0] + r.p[1] + r.p[2]));
     const sumP1 = d.rows.reduce((a, r) => a + r.p[0], 0);
     return card(cardHead("UPT " + title(d.unit), { dot: "var(--primary)", meta: `<span class="badge red">${fmt(sumP1)} P1</span>` }),
       `<div class="stack">${d.rows.map(r => {
          const t = r.p[0] + r.p[1] + r.p[2];
          return `<div class="stack-row">
            <div class="stack-top"><span>${r.cat}</span><b>${fmt(t)}</b></div>
            <div class="stack-bar" style="--w:${(t / max * 100).toFixed(2)}%" title="P1 ${fmt(r.p[0])} · P2 ${fmt(r.p[1])} · P3 ${fmt(r.p[2])}">
              <i style="flex:${r.p[0]};background:var(--p1)"></i><i style="flex:${r.p[1]};background:var(--p2)"></i><i style="flex:${r.p[2]};background:var(--p3)"></i>
            </div></div>`;
        }).join("")}</div>`);
   }).join("")}
  </div>`;
}

function pageTower() {
  const k = TOWER_KPI, pct = n => Math.round(n / k.total * 100) + "% dari total aset";
  return `
  <div class="grid g4">
    ${stat("Total aset Tower ERS", k.total, { tone: C.blue, ico: "tower", foot: "Seluruh UIT JBM" })}
    ${stat("Sedang dipinjam", k.dipinjam, { tone: C.red, ico: "swap", foot: pct(k.dipinjam) })}
    ${stat("Standby lengkap", k.lengkap, { tone: C.green, ico: "check", foot: pct(k.lengkap) })}
    ${stat("Standby tidak lengkap", k.tidakLengkap, { tone: C.amber, ico: "alert", foot: pct(k.tidakLengkap) })}
  </div>
  <div class="ratio" aria-label="Komposisi status Tower ERS">
    <i style="flex:${k.dipinjam};background:${C.red}" title="Dipinjam ${k.dipinjam}"></i>
    <i style="flex:${k.lengkap};background:${C.green}" title="Standby lengkap ${k.lengkap}"></i>
    <i style="flex:${k.tidakLengkap};background:${C.amber}" title="Standby tidak lengkap ${k.tidakLengkap}"></i>
  </div>

  ${card(cardHead("Persebaran Tower ERS", { ico: "pin", dot: C.teal, meta: legend([["Standby lengkap", C.green], ["Standby tidak lengkap", C.amber], ["Dipinjam", C.red]]) }),
    map([{ at: "madiun", c: C.green, label: "Standby lengkap — Madiun" }, { at: "ngoro", c: C.amber, label: "Standby tidak lengkap — Ngoro" }, { at: "probolinggo", c: C.red, label: "Dipinjam — Probolinggo" }], { h: 260 }), "mt")}

  ${sectionTitle("Stok Material Tower ERS", "Cari nama material atau klik judul kolom untuk mengurutkan")}
  <div class="grid g3">
   ${Object.entries(MATERIALS).map(([name, rows], idx) => {
     const total = rows.reduce((a, r) => a + r[1], 0);
     return card(cardHead(name, { ico: "box", dot: C.violet, sub: `${rows.length} jenis · ${fmt(total)} unit` }),
       `<label class="search">${icon("search")}<input type="search" placeholder="Cari material…" aria-label="Cari material ${esc(name)}" data-filter="${idx}"></label>
        <div class="table-wrap"><table class="table" data-table="${idx}">
          <thead><tr><th><button type="button" data-sort="0">Material ${icon("sort")}</button></th><th class="num"><button type="button" data-sort="1">Jumlah ${icon("sort")}</button></th></tr></thead>
          <tbody>${rows.map(r => `<tr><td>${esc(r[0])}</td><td class="num">${fmt(r[1])}</td></tr>`).join("")}</tbody>
        </table><div class="empty" hidden>Material tidak ditemukan.</div></div>`, "material");
   }).join("")}
  </div>`;
}

function trafoCard(d) {
  const row = (ico, l, v) => `<div class="kv">${icon(ico)}<div><dt>${l}</dt><dd>${esc(v)}</dd></div></div>`;
  return `<article class="card trafo" style="--tone:var(--c-${d.tone})">
    <header class="card-h"><div class="h-txt"><h3>${esc(d.title)}</h3><p>${esc(d.lokasi)}</p></div><span class="badge ${d.tone}">${d.status}</span></header>
    <dl class="card-b kvs">
      ${row("doc", "Keterangan", d.ket)}
      ${row("bolt", "Unit trafo", d.unit)}
      ${row("calendar", "Rencana", d.rencana)}
      ${row("gear", "Peralatan", d.alat)}
    </dl>
  </article>`;
}
function pageTrafo() {
  const k = TRAFO_KPI;
  const pins = [
    { at: "ngoro", c: C.green, label: "Malang — GI Ngoro" }, { at: "paiton", c: C.blue, label: "Probolinggo — GISTET Paiton" },
    { at: "gianyar", c: C.green, label: "Bali — GI Gianyar" }, { at: "tulungagung", c: C.green, label: "Madiun — GI New Tulungagung" },
    { at: "tandes", c: C.red, label: "Gresik — GIS Tandes (rusak)" }, { at: "kalisari", c: C.red, label: "Surabaya — GI Kalisari (rusak)" }
  ];
  return `
  <div class="grid g4">
    ${stat("Total aset Trafo Mobile", k.total, { tone: C.teal, ico: "truck" })}
    ${stat("Beroperasi", k.operasi, { tone: C.green, ico: "bolt" })}
    ${stat("Dipinjam", k.dipinjam, { tone: C.amber, ico: "swap" })}
    ${stat("Rusak", k.rusak, { tone: C.red, ico: "alert" })}
  </div>

  ${card(cardHead("Persebaran Aset Trafo Mobile", { ico: "pin", dot: C.teal,
      meta: `<a class="btn" href="${TRAFO_LINK}" target="_blank" rel="noopener">${icon("external")}<span>Hasil pengujian rutin</span></a>` }),
    map(pins, { h: 260 }) + legend([["Berbeban", C.green], ["Standby", C.blue], ["Rusak", C.red]]), "mt")}

  ${sectionTitle("Di Lingkungan UIT JBM", `${TRAFO_UPT.length} unit`)}
  <div class="grid g4">${TRAFO_UPT.map(trafoCard).join("")}</div>

  ${sectionTitle("Dipinjam & Rusak", "Unit di luar UIT JBM atau tidak layak operasi")}
  <div class="grid g4">${TRAFO_OTHER.map(trafoCard).join("")}</div>`;
}

/* ---------- Routing ---------- */
const PAGES = [
  { group: "Kinerja", id: "kinerja", label: "Kinerja PDKB", ico: "chart", title: "Kinerja PDKB", eyebrow: "UIT JBM · Tahun 2026", render: pageKinerja },
  { group: "Kinerja", id: "optimalisasi", label: "Optimalisasi PDKB", ico: "target", title: "Optimalisasi PDKB", eyebrow: "Gardu Induk & Jaringan", render: pageOptim },
  { group: "Kondisi Aset", id: "health", label: "Health Index", ico: "heart", title: "Health Index", eyebrow: "Aset Jaringan & Gardu Induk", render: pageHealth },
  { group: "Kondisi Aset", id: "jar", label: "Asesmen JAR", ico: "line", title: "Asesmen Jaringan", eyebrow: "Health Index per UPT", render: () => pageAssess(0, "Jaringan") },
  { group: "Kondisi Aset", id: "gi", label: "Asesmen GI", ico: "building", title: "Asesmen Gardu Induk", eyebrow: "Health Index per UPT", render: () => pageAssess(2, "Gardu Induk") },
  { group: "Peralatan ERS", id: "tower", label: "Tower Emergency", ico: "tower", title: "Tower Emergency", eyebrow: "Emergency Restoration System", render: pageTower },
  { group: "Peralatan ERS", id: "trafo", label: "Trafo Mobile", ico: "truck", title: "Trafo Mobile", eyebrow: "Emergency Restoration System", render: pageTrafo }
];

function renderNav() {
  const groups = [...new Set(PAGES.map(p => p.group))];
  $("#nav").innerHTML = groups.map(g => `
    <div class="nav-group"><div class="nav-cap">${g}</div>
    ${PAGES.filter(p => p.group === g).map(p => `<a class="nav-item" href="#${p.id}" data-id="${p.id}" title="${p.label}">${icon(p.ico)}<span>${p.label}</span></a>`).join("")}
    </div>`).join("");
}

function route() {
  const id = location.hash.slice(1);
  const page = PAGES.find(p => p.id === id) || PAGES[0];
  $("#pageTitle").textContent = page.title;
  $("#pageEyebrow").textContent = page.eyebrow;
  document.title = `${page.title} — Dashboard FASHAR`;
  const content = $("#content");
  content.innerHTML = `<div class="page">${page.render()}</div>`;
  $$(".nav-item").forEach(a => a.toggleAttribute("aria-current", a.dataset.id === page.id));
  if (a11yNavigated) content.focus({ preventScroll: true });
  window.scrollTo({ top: 0 });
  closeDrawer();
}
let a11yNavigated = false;

/* ---------- Interaksi ---------- */
function closeDrawer() {
  document.body.classList.remove("drawer-open");
  $("#backdrop").hidden = true;
  $("#menuBtn").setAttribute("aria-expanded", "false");
}
function openDrawer() {
  document.body.classList.add("drawer-open");
  $("#backdrop").hidden = false;
  $("#menuBtn").setAttribute("aria-expanded", "true");
}
const store = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } };

$("#menuBtn").addEventListener("click", () => document.body.classList.contains("drawer-open") ? closeDrawer() : openDrawer());
$("#backdrop").addEventListener("click", closeDrawer);
document.addEventListener("keydown", e => { if (e.key === "Escape") closeDrawer(); });

$("#collapseBtn").addEventListener("click", () => {
  const on = document.documentElement.classList.toggle("nav-collapsed");
  store("fashar-collapsed", on ? "1" : "0");
});
$("#themeBtn").addEventListener("click", () => {
  const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = t;
  store("fashar-theme", t);
});

/* Pencarian & pengurutan tabel material */
document.addEventListener("input", e => {
  const idx = e.target.dataset.filter;
  if (idx === undefined) return;
  const table = $(`[data-table="${idx}"]`), q = e.target.value.trim().toLowerCase();
  let shown = 0;
  $$("tbody tr", table).forEach(tr => { const m = tr.cells[0].textContent.toLowerCase().includes(q); tr.hidden = !m; shown += m; });
  table.nextElementSibling.hidden = shown > 0;
});
document.addEventListener("click", e => {
  const btn = e.target.closest("[data-sort]");
  if (!btn) return;
  const table = btn.closest("table"), col = +btn.dataset.sort, th = btn.parentElement;
  const dir = th.getAttribute("aria-sort") === "ascending" ? -1 : 1;
  $$("th", table).forEach(h => h.removeAttribute("aria-sort"));
  th.setAttribute("aria-sort", dir === 1 ? "ascending" : "descending");
  const body = table.tBodies[0];
  const val = tr => col ? +tr.cells[1].textContent.replace(/\./g, "") : tr.cells[0].textContent;
  [...body.rows].sort((a, b) => (col ? val(a) - val(b) : val(a).localeCompare(val(b), "id")) * dir).forEach(r => body.appendChild(r));
});

renderNav();
route();
a11yNavigated = true;
window.addEventListener("hashchange", route);
