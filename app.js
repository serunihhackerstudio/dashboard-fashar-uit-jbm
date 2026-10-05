const units=["SURABAYA","GRESIK","MALANG","MADIUN","PROBOLINGGO","BALI"];
function bars(el,vals,blue=false){
 document.getElementById(el).innerHTML=units.map((u,i)=>`<div class="bar-row"><span>${u}</span><div class="bar"><div class="fill ${blue?'bluef':''}" style="width:${Math.min(vals[i],100)}%"></div></div><b>${vals[i]}</b></div>`).join("")
}
bars("b1",[100,94,90,87,92,98]); bars("b2",[96,88,72,95,91,70]); bars("b3",[100,83,104,88,92,90]);
bars("b4",[105,96,92,78,87,95],true); bars("b5",[95,120,70,84,46,100],true); bars("b6",[98,92,99,101,75,90],true);
document.getElementById("cert").innerHTML=["LEVEL 2 JAR","LEVEL 2 GI","LEVEL 3 JAR","LEVEL 3 GI","LEVEL 4","LEVEL 5"].map((x,i)=>`<div class="bar-row"><span>${x}</span><div class="bar"><div class="fill" style="width:${[78,82,79,66,42,15][i]}%;background:#2FAF75"></div></div><b>${[48,50,47,40,25,6][i]}</b></div>`).join("");

const cats=["ISOLATOR","ACCESSORIES COLD","ACCESSORIES HOT","ACCESSORIES GSW"];
function healthCards(target,vals){
 document.getElementById(target).innerHTML=cats.map((c,i)=>`<div class="card"><div class="card-h red">${c}</div><div class="card-b"><div class="donut"></div><div class="priority"><div class="p1">P1<br>${vals[i][0]}</div><div class="p2">P2<br>${vals[i][1]}</div><div class="p3">P3<br>${vals[i][2]}</div></div></div></div>`).join("")
}
healthCards("healthJar",[[207,807,16059],[222,1098,8049],[471,1976,10563],[415,1027,4229]]);
healthCards("healthGI",[[47,437,2502],[9,107,1675],[97,462,1914],[81,386,1846]]);

function assess(target,title){
 document.getElementById(target).innerHTML=units.map((u,idx)=>`<div class="card"><div class="card-h red">UPT ${u}</div><div class="card-b"><div class="legend"><span><i class="dot" style="background:#E84A3C"></i>P1</span><span><i class="dot" style="background:#F6C945"></i>P2</span><span><i class="dot" style="background:#2588E6"></i>P3</span></div>${cats.map((c,j)=>`<div class="bar-row"><span>${c}</span><div class="bar"><div class="fill bluef" style="width:${[72,58,83,66][(idx+j)%4]}%"></div></div><b>${[120,620,1500,2800][(idx+j)%4]}</b></div>`).join("")}</div></div>`).join("")
}
assess("jarGrid","JAR"); assess("giGrid","GI");

const mats={
 "LINDSEY":[
  ["POST INSULATOR SUPPORT",3],
  ["TOWER GIMBAL",8],
  ["4-WAY GUY PLATE",19],
  ["GUY PLATE",17],
  ["OVERHEAD GROUND WIRE BRACKET",3],
  ["ANCHOR BRACKET (MOCK)",12],
  ["CROSS ARM SUPPORT (MOCK)",7],
  ["INSULATOR CLAMP (MOCK)",21],
  ["GUY WIRE FITTING (MOCK)",14],
  ["STRUCTURE CONNECTOR (MOCK)",9]
 ],
 "TOWER SOLUTION":[
  ["Transfer Rod",324],
  ["Tower Section",72],
  ["Base Pivot",15],
  ["Bolt Assembly",498],
  ["Universal attachment",30],
  ["Extension Mast (MOCK)",18],
  ["Support Bracket (MOCK)",42],
  ["Pivot Connector (MOCK)",24],
  ["Guy Assembly (MOCK)",36],
  ["Foundation Plate (MOCK)",11]
 ],
 "SBB":[
  ["Mast Section",22],
  ["Universal Bracket",27],
  ["Line Post Insulator Bracket",6],
  ["Bolt 3/4",180],
  ["Hex Nut 3/4",374],
  ["Diagonal Brace (MOCK)",34],
  ["Base Plate (MOCK)",16],
  ["Lock Washer 3/4 (MOCK)",210],
  ["Connecting Plate (MOCK)",28],
  ["Support Clamp (MOCK)",13]
 ]
}
document.getElementById("materialTables").innerHTML=Object.entries(mats).map(([k,rows],idx)=>`
<div class="card material-card" data-material-card="${idx}">
  <div class="card-h red">${k}</div>
  <div class="material-search-wrap">
    <input class="material-search" type="search" placeholder="Cari material..." aria-label="Cari material ${k}" oninput="filterMaterialTable(${idx}, this.value)">
  </div>
  <div class="card-b">
    <table class="table">
      <thead><tr><th>MATERIAL</th><th>JUMLAH</th></tr></thead>
      <tbody>${rows.map(r=>`<tr data-material-row><td>${r[0]}</td><td>${r[1]}</td></tr>`).join("")}</tbody>
    </table>
    <div class="material-empty" style="display:none">Material tidak ditemukan.</div>
  </div>
</div>`).join("");

function filterMaterialTable(cardIndex, query){
  const card=document.querySelector(`[data-material-card="${cardIndex}"]`);
  if(!card) return;
  const q=(query||"").trim().toLowerCase();
  const rows=[...card.querySelectorAll("[data-material-row]")];
  let visible=0;
  rows.forEach(row=>{
    const match=row.textContent.toLowerCase().includes(q);
    row.style.display=match?"":"none";
    if(match) visible++;
  });
  const empty=card.querySelector(".material-empty");
  if(empty) empty.style.display=visible?"none":"block";
}

const trafoIcons={
 location:`<svg class="info-icon" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-5.2-7-11a7 7 0 1 1 14 0c0 5.8-7 11-7 11Z" fill="white"/><circle cx="12" cy="10" r="2.8" fill="#8A867A"/></svg>`,
 doc:`<svg class="info-icon" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="2" fill="white"/><rect x="7" y="8" width="10" height="1.8" rx=".9" fill="#8A867A"/><rect x="7" y="12" width="8" height="1.8" rx=".9" fill="#8A867A"/></svg>`,
 transformer:`<svg class="info-icon" viewBox="0 0 24 24" fill="none"><rect x="5" y="7" width="14" height="10" rx="2" fill="white"/><rect x="8" y="4" width="2" height="3" fill="white"/><rect x="14" y="4" width="2" height="3" fill="white"/><rect x="8" y="17" width="2" height="3" fill="white"/><rect x="14" y="17" width="2" height="3" fill="white"/></svg>`,
 rotate:`<svg class="info-icon" viewBox="0 0 24 24" fill="none"><path d="M20 7v5h-5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 17v-5h5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 9a7 7 0 0 1 11-2" stroke="white" stroke-width="2" stroke-linecap="round"/><path d="M17 15a7 7 0 0 1-11 2" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>`,
 gear:`<svg class="info-icon" viewBox="0 0 24 24" fill="none"><path d="M12 8.5A3.5 3.5 0 1 0 12 15.5A3.5 3.5 0 1 0 12 8.5Z" fill="white"/><path d="M12 2l1.3 2.6 2.9.5-.9 2.8 2 2-2 2 .9 2.8-2.9.5L12 22l-1.3-2.6-2.9-.5.9-2.8-2-2 2-2-.9-2.8 2.9-.5L12 2Z" stroke="white" stroke-width="1.4" stroke-linejoin="round"/></svg>`
};

const trafoUptData=[
 {title:"UPT MALANG",tone:"green",items:[
  {icon:"location",text:"GI 150 kV Ngoro"},
  {icon:"doc",text:"Perkuatan GI Ngoro (Pertumbuhan beban)"},
  {icon:"transformer",text:"CG Pauwels - 30 MVA (Berbeban)"},
  {icon:"rotate",text:"Extension trafo AI 2024 rencana onsite 2027"},
  {icon:"gear",text:"Trafo, MTU, Kubikel, Kontrol"}]},
 {title:"UPT PROBOLINGGO",tone:"green",items:[
  {icon:"location",text:"GISTET 500 kV Paiton"},
  {icon:"doc",text:"Perkuatan trafo TFT karena hanya 1 bay trafo"},
  {icon:"transformer",text:"CG Pauwels - 30 MVA (Standby)"},
  {icon:"rotate",text:"Rencana perbaikan 2026"},
  {icon:"gear",text:"Trafo, MTU, Kubikel, Kontrol"}]},
 {title:"UPT BALI",tone:"green",items:[
  {icon:"location",text:"GI 150 kV Gianyar"},
  {icon:"doc",text:"Perkuatan GI Ngoro (Pertumbuhan beban)"},
  {icon:"transformer",text:"CG Pauwels - 30 MVA (Berbeban)"},
  {icon:"rotate",text:"Belum ada ekstension trafo karena terkendala pembebasan lahan"},
  {icon:"gear",text:"Trafo, MTU, Kubikel"}]},
 {title:"UPT MADIUN",tone:"green",items:[
  {icon:"location",text:"GI 150 kV New Tulungagung"},
  {icon:"doc",text:"Perkuatan GI New Tul (Pertumbuhan beban)"},
  {icon:"transformer",text:"CG Pauwels - 30 MVA (Berbeban)"},
  {icon:"rotate",text:"Hanya 1 trafo"},
  {icon:"gear",text:"Trafo, MTU, Kubikel, Kontrol"}]}
];

const trafoLoanData=[
 {title:"IKN",tone:"amber",items:[
  {icon:"location",text:"IKN"},
  {icon:"doc",text:"Pendukung Pembangunan IKN"},
  {icon:"transformer",text:"CG Pauwels - 30 MVA"},
  {icon:"rotate",text:"-"},
  {icon:"gear",text:"Trafo, MTU, Kubikel, Kontrol"}]},
 {title:"GI 150 kV GARUDA SAKTI",tone:"amber",items:[
  {icon:"location",text:"GI 150 kV Garuda Sakti"},
  {icon:"doc",text:"Program High Quality Growth 2024"},
  {icon:"transformer",text:"Fuji Electric - 20 MVA"},
  {icon:"rotate",text:"-"},
  {icon:"gear",text:"Trafo, MTU, Kubikel"}]},
 {title:"UPT GRESIK",tone:"red",items:[
  {icon:"location",text:"GIS 150 kV Tandes"},
  {icon:"doc",text:"Kondisi Tidak Layak Operasi / Rusak Berat"},
  {icon:"transformer",text:"ABB (Rusak)"},
  {icon:"rotate",text:"Rencana ATTB"},
  {icon:"gear",text:"MTU, Kubikel"}]},
 {title:"UPT SURABAYA",tone:"red",items:[
  {icon:"location",text:"GI 150 kV Kalisari"},
  {icon:"doc",text:"Hasil uji buruk pada belitan HV to Ground, OLTC rusak dan hasil uji winding buruk"},
  {icon:"transformer",text:"ABB - 30 MVA (Rusak)"},
  {icon:"rotate",text:"Rencana ATTB"},
  {icon:"gear",text:"Trafo, MTU, Kubikel"}]}
];

function renderTrafoCard(card,loan=false){
 return `<div class="${loan?'loan-card':'trafo-asset-card'}">
  <div class="trafo-asset-head ${card.tone||''}">${card.title}</div>
  <div class="${loan?'loan-body':'trafo-asset-body'}">
   <div class="info-list">
    ${card.items.map(item=>`<div class="info-row">${trafoIcons[item.icon]}<div class="info-text">${item.text}</div></div>`).join("")}
   </div>
  </div>
 </div>`;
}
document.getElementById("trafoUptCards").innerHTML=trafoUptData.map(c=>renderTrafoCard(c,false)).join("");
document.getElementById("trafoLoanCards").innerHTML=trafoLoanData.map(c=>renderTrafoCard(c,true)).join("");

function go(id,el){
 document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
 document.getElementById(id).classList.add("active");
 document.querySelectorAll(".nav-item").forEach(n=>n.classList.remove("active")); el.classList.add("active");
 const titles={kinerja:"Kinerja PDKB <span>UIT JBM Tahun 2026</span>",optimalisasi:"Optimalisasi PDKB <span>GI & Jaringan</span>",health:"Health Index <span>Aset Jaringan dan Gardu Induk</span>",jar:"Asesmen JAR",gi:"Asesmen GI",tower:"Tower Emergency",trafo:"Trafo Mobile"};
 document.getElementById("pageTitle").innerHTML=titles[id];
 if(innerWidth<760) document.getElementById("sidebar").classList.remove("mobile-open");
}
function toggleSidebar(){ if(innerWidth>=760) document.getElementById("sidebar").classList.toggle("collapsed"); else mobileSidebar() }
function mobileSidebar(){document.getElementById("sidebar").classList.toggle("mobile-open")}
