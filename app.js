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
 "LINDSEY":[["POST INSULATOR SUPPORT",3],["TOWER GIMBAL",8],["4-WAY GUY PLATE",19],["GUY PLATE",17],["OVERHEAD GROUND WIRE BRACKET",3]],
 "TOWER SOLUTION":[["Transfer Rod",324],["Tower Section",72],["Base Pivot",15],["Bolt Assembly",498],["Universal attachment",30]],
 "SBB":[["Mast Section",22],["Universal Bracket",27],["Line Post Insulator Bracket",6],["Bolt 3/4",180],["Hex Nut 3/4",374]]
}
document.getElementById("materialTables").innerHTML=Object.entries(mats).map(([k,rows])=>`<div class="card"><div class="card-h red">${k}</div><div class="card-b"><table class="table"><thead><tr><th>MATERIAL</th><th>JUMLAH</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join("")}</tbody></table></div></div>`).join("");

const trafos=[
["UPT MALANG","GI 150 kV Ngoro","CG Pauwels - 30 MVA","Berbeban","Extension trafo AI 2024 rencana onsite 2027"],
["UPT PROBOLINGGO","GISTET 500 kV Paiton","CG Pauwels - 30 MVA","Standby","Rencana perbaikan 2026"],
["UPT BALI","GI 150 kV Gianyar","CG Pauwels - 30 MVA","Berbeban","Belum ada extension trafo"],
["UPT MADIUN","GI 150 kV New Tulungagung","CG Pauwels - 30 MVA","Berbeban","Hanya 1 trafo"],
["UPT GRESIK","GIS 150 kV Tandes","ABB","Rusak","Rencana ATT"],
["UPT SURABAYA","GI 150 kV Kalisari","ABB - 30 MVA","Rusak","Rencana ATT"]
]
document.getElementById("trafoCards").innerHTML=trafos.map(t=>`<div class="asset-card"><h4>${t[0]}</h4><div><b>${t[1]}</b></div><div class="muted">${t[2]} · ${t[3]}</div><div style="margin-top:8px">${t[4]}</div></div>`).join("");

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
