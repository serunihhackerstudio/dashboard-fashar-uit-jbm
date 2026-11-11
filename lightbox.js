/* =========================================================
   LIGHTBOX FOTO + ZOOM (galeri foto pop-up detail & form Edit)
   Klik foto di .ab-det-strip / .ph-grid (bukan pratinjau "belum disimpan") ->
   tampil besar; zoom dengan roda mouse, cubit (pinch), tombol +/−, klik ganda;
   geser saat diperbesar; panah ←/→ untuk foto lain; Esc untuk menutup.
   ========================================================= */
(function () {
  const big = u => String(u || "").replace(/([?&]sz=)w\d+/, "$1w2000");
  document.body.insertAdjacentHTML("beforeend", `<dialog class="lbx" id="lbx" aria-label="Foto">
    <div class="lbx-stage" id="lbxStage"><img id="lbxImg" alt="" draggable="false"></div>
    <div class="lbx-top"><span id="lbxCount"></span><div class="lbx-tools">
      <button type="button" data-z="-" aria-label="Perkecil">−</button><span id="lbxPct">100%</span><button type="button" data-z="+" aria-label="Perbesar">+</button>
      <button type="button" data-z="0" aria-label="Ukuran awal">⤢</button><a id="lbxOpen" target="_blank" rel="noopener" aria-label="Buka di Google Drive">↗</a>
      <button type="button" data-x aria-label="Tutup">✕</button></div></div>
    <button type="button" class="lbx-nav prev" data-n="-1" aria-label="Foto sebelumnya">‹</button><button type="button" class="lbx-nav next" data-n="1" aria-label="Foto berikutnya">›</button>
    <p class="lbx-hint">Scroll / cubit untuk zoom · seret untuk menggeser · klik ganda untuk perbesar</p></dialog>`);
  const box = document.getElementById("lbx"), img = document.getElementById("lbxImg"), stage = document.getElementById("lbxStage");
  const V = { list: [], i: 0, z: 1, x: 0, y: 0, pts: new Map(), pinch: 0, pz: 1, drag: null };
  const apply = () => { img.style.transform = `translate(${V.x}px,${V.y}px) scale(${V.z})`; document.getElementById("lbxPct").textContent = Math.round(V.z * 100) + "%"; stage.classList.toggle("zoomed", V.z > 1); };
  const zoomTo = (z, cx, cy) => {
    z = Math.min(6, Math.max(1, z));
    if (cx != null) { const r = stage.getBoundingClientRect(), ox = cx - r.left - r.width / 2, oy = cy - r.top - r.height / 2; V.x = ox - (ox - V.x) * z / V.z; V.y = oy - (oy - V.y) * z / V.z; }
    V.z = z; if (z === 1) { V.x = 0; V.y = 0; } apply();
  };
  function show(i) {
    V.i = (i + V.list.length) % V.list.length; V.z = 1; V.x = 0; V.y = 0; apply();
    const it = V.list[V.i]; img.src = it.thumb; img.alt = it.alt || "Foto";
    const hi = new Image(); hi.onload = () => { if (V.list[V.i] === it) img.src = hi.src; }; hi.src = big(it.thumb);
    document.getElementById("lbxOpen").href = it.view || hi.src;
    document.getElementById("lbxCount").textContent = V.list.length > 1 ? `${V.i + 1} / ${V.list.length}` : "";
    box.querySelectorAll(".lbx-nav").forEach(b => { b.hidden = V.list.length < 2; });
  }
  function open(list, i) { V.list = list; if (!box.open) box.showModal(); document.body.classList.add("lbx-open"); show(i || 0); }
  function close() { if (box.open) box.close(); }
  box.addEventListener("close", () => { document.body.classList.remove("lbx-open"); img.src = ""; });
  window.openLightbox = open;

  document.addEventListener("click", e => {
    const a = e.target.closest(".ab-det-strip a, .ph-grid .ph-item:not(.ps-new) a.ph-img, .ab-detail-top .ab-photo a");
    if (!a || !a.querySelector("img")) return;
    e.preventDefault();
    const wrap = a.closest(".ab-det-strip, .ph-grid, .ab-photo"), links = [...wrap.querySelectorAll(a.matches(".ph-img") ? ".ph-item:not(.ps-new) a.ph-img" : "a")].filter(x => x.querySelector("img"));
    open(links.map(x => ({ thumb: x.querySelector("img").src, view: x.getAttribute("href"), alt: x.querySelector("img").alt })), links.indexOf(a));
  }, true);
  box.addEventListener("click", e => {
    const t = e.target.closest("[data-z],[data-x],[data-n]");
    if (t && t.dataset.z) { const r = stage.getBoundingClientRect(); return zoomTo(t.dataset.z === "0" ? 1 : V.z * (t.dataset.z === "+" ? 1.5 : 1 / 1.5), r.left + r.width / 2, r.top + r.height / 2); }
    if (t && t.dataset.n) return show(V.i + Number(t.dataset.n));
    if ((t && "x" in t.dataset) || e.target === stage || e.target === box) close();
  });
  stage.addEventListener("wheel", e => { e.preventDefault(); zoomTo(V.z * (e.deltaY < 0 ? 1.2 : 1 / 1.2), e.clientX, e.clientY); }, { passive: false });
  img.addEventListener("dblclick", e => zoomTo(V.z > 1 ? 1 : 2.5, e.clientX, e.clientY));
  stage.addEventListener("pointerdown", e => {
    if (e.target !== img) return;
    stage.setPointerCapture(e.pointerId); V.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (V.pts.size === 2) { const [a, b] = [...V.pts.values()]; V.pinch = Math.hypot(a.x - b.x, a.y - b.y); V.pz = V.z; V.drag = null; }
    else V.drag = { x: e.clientX - V.x, y: e.clientY - V.y };
  });
  stage.addEventListener("pointermove", e => {
    if (!V.pts.has(e.pointerId)) return;
    V.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (V.pts.size === 2 && V.pinch) { const [a, b] = [...V.pts.values()]; zoomTo(V.pz * Math.hypot(a.x - b.x, a.y - b.y) / V.pinch, (a.x + b.x) / 2, (a.y + b.y) / 2); }
    else if (V.drag && V.z > 1) { V.x = e.clientX - V.drag.x; V.y = e.clientY - V.drag.y; apply(); }
  });
  const up = e => { V.pts.delete(e.pointerId); if (V.pts.size < 2) V.pinch = 0; if (!V.pts.size) V.drag = null; };
  stage.addEventListener("pointerup", up); stage.addEventListener("pointercancel", up);
  document.addEventListener("keydown", e => {
    if (!box.open) return;
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === "ArrowRight") show(V.i + 1); else if (e.key === "ArrowLeft") show(V.i - 1);
    else if (e.key === "+" || e.key === "=") zoomTo(V.z * 1.5); else if (e.key === "-") zoomTo(V.z / 1.5); else if (e.key === "0") zoomTo(1);
  }, true);
})();
