/* =========================================================
   DATA DUMMY — Alat Berat & Alat Bantu UIT JBM
   Semua nilai di file ini CONTOH, bukan data asli.
   Ganti dengan data real (atau sambungkan ke Google Sheets) nanti.
   ========================================================= */
(function () {
  const LOKASI = [
    ["UPT Surabaya", "Gudang Ketintang"], ["UPT Surabaya", "GI Sukolilo"], ["UPT Gresik", "Gudang Gresik"],
    ["UPT Malang", "Gudang Pakis"], ["UPT Probolinggo", "Gudang Grati"], ["UPT Madiun", "Gudang Madiun"], ["UPT Bali", "Gudang Pesanggaran"]
  ];
  // [nama, merk, kapasitas, fungsi]
  const JENIS = {
    crane: [["TRUCK CRANE", "Nissan", "8 TON"], ["TRUCK CRANE", "Hino", "3 TON"], ["TRUCK CRANE", "Isuzu", "3 TON"],
      ["MOBILE CRANE", "Tadano", "25 TON"], ["MOBILE CRANE", "Kato", "22 TON"], ["CRAWLER CRANE", "Sumitomo", "50 TON"], ["TRUCK CRANE", "Mitsubishi Fuso", "5 TON"]],
    forklift: [["FORKLIFT", "Patria", "3 TON"], ["FORKLIFT", "Nissan", "5 TON"], ["FORKLIFT", "Toyota", "2.5 TON"], ["FORKLIFT", "Komatsu", "3 TON"], ["FORKLIFT", "Mitsubishi", "7 TON"]],
    manlift: [["MANLIFT / SKY LIFT", "Aichi", "12 M"], ["MANLIFT / SKY LIFT", "Tadano", "17 M"], ["SCISSOR LIFT", "Genie", "10 M"]],
    pendukung: [["HAND PALLET", "Krisbow", "2.5 TON"], ["HAND PALLET", "Noblelift", "3 TON"], ["CHAIN BLOCK", "Kito", "5 TON"], ["CHAIN BLOCK", "Vital", "3 TON"],
      ["GENSET PORTABLE", "Yamaha", "5 KVA"], ["GENSET", "Cummins", "100 KVA"], ["KOMPRESOR UDARA", "Atlas Copco", "250 CFM"], ["MESIN FILTER MINYAK", "Globecore", "6.000 L/JAM"],
      ["TRAILER / LOWBED", "Hino", "40 TON"], ["DONGKRAK HIDROLIK", "Enerpac", "50 TON"], ["WINCH / TIRFOR", "Tractel", "3.2 TON"], ["MESIN LAS", "Lincoln", "400 A"]]
  };
  const FUNGSI = { crane: "Angkat Angkut", forklift: "Angkat Angkut", manlift: "Kerja Ketinggian", pendukung: "Alat Pendukung" };
  const KATEGORI_COUNT = { crane: 14, forklift: 10, manlift: 3, pendukung: 25 };
  const KONDISI = ["Baik", "Baik", "Baik", "Baik", "Service Time", "Baik", "Rusak Ringan", "Baik", "Baik", "Rusak Berat"];
  const IZIN = ["Belum ada data", "SIA & SILO berlaku s.d. Jun 2027", "SILO kedaluwarsa Mar 2026", "SIA & SILO berlaku s.d. Des 2026", "Belum ada data"];
  const PEKERJAAN = ["Overhoul Trafo#1 GI Gilitimur", "Penggantian PMT 150 kV GI Sengkaling", "Mobilisasi trafo mobile ke GI Ngoro", "Pemeliharaan rutin GITET Paiton",
    "Penggantian CT bay line GI Kalisari", "Perbaikan tower SUTT Gresik–Lamongan", "Bongkar muat material gudang", "Penggantian isolator SUTET Krian–Gresik"];
  const PEMINJAM = ["UPT Gresik", "UPT Malang", "UPT Madiun", "UPT Probolinggo", "UPT Bali", "UPT Surabaya"];

  let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const pick = a => a[Math.floor(rnd() * a.length)];
  const alat = [];
  let n = 0;
  Object.entries(KATEGORI_COUNT).forEach(([kat, count]) => {
    for (let i = 0; i < count; i++) {
      const [nama, merk, kapasitas] = JENIS[kat][i % JENIS[kat].length];
      const [upt, lokasi] = LOKASI[(n * 3 + i) % LOKASI.length];
      const kondisi = KONDISI[(n + i * 3) % KONDISI.length];
      const layak = kondisi !== "Rusak Berat";
      const status = kondisi === "Rusak Berat" || kondisi === "Rusak Ringan" ? "Perbaikan" : "Tersedia"; // "Dipinjam" diturunkan dari data peminjaman
      n++;
      alat.push({
        id: "AB-" + String(n).padStart(3, "0"), kategori: kat, nama, merk, tipe: "", kapasitas,
        tahun: rnd() < .3 ? null : String(1992 + Math.floor(rnd() * 33)),
        noSeri: rnd() < .4 ? null : String(100000 + Math.floor(rnd() * 900000)) + (rnd() < .3 ? "-P" : ""),
        upt, lokasi, status, layak, kondisi, fungsi: FUNGSI[kat], suratIzin: pick(IZIN),
        terakhirDipinjam: rnd() < .45 ? { oleh: pick(PEMINJAM).replace("UPT ", ""), pekerjaan: pick(PEKERJAAN) } : null,
        foto: null
      });
    }
  });

  // Peminjaman contoh
  const STATUS = ["Menunggu Approval", "Menunggu Approval", "Disetujui", "Dipinjam", "Dipinjam", "Dikembalikan", "Dikembalikan", "Dikembalikan", "Ditolak"];
  const iso = (y, m, d) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const peminjaman = [];
  for (let i = 0; i < 18; i++) {
    const st = STATUS[i % STATUS.length];
    const aktif = ["Menunggu Approval", "Disetujui", "Dipinjam"].includes(st);
    let k = (i * 7 + 3) % alat.length; // pengajuan aktif hanya untuk alat yang tidak sedang diperbaiki
    while (aktif && alat[k].status === "Perbaikan") k = (k + 1) % alat.length;
    const a = alat[k];
    const m = 11 - Math.floor(i / 3), d = 3 + (i * 5) % 24, len = 3 + (i % 9);
    const mulai = iso(2026, Math.max(m, 1), d), selesai = iso(2026, Math.max(m, 1), Math.min(d + len, 28));
    const diajukan = iso(2026, Math.max(m - 1, 1), Math.max(d - 6, 1));
    const hist = [{ t: diajukan, s: "Diajukan", oleh: "Admin " + PEMINJAM[i % PEMINJAM.length] }];
    if (st !== "Menunggu Approval") hist.push({ t: iso(2026, Math.max(m - 1, 1), Math.max(d - 3, 1)), s: st === "Ditolak" ? "Ditolak" : "Disetujui", oleh: "TL Pemeliharaan UIT JBM", catatan: st === "Ditolak" ? "Alat dijadwalkan untuk pekerjaan prioritas lain." : "" });
    if (st === "Dipinjam" || st === "Dikembalikan") hist.push({ t: mulai, s: "Dipinjam", oleh: "Petugas gudang " + a.lokasi });
    if (st === "Dikembalikan") hist.push({ t: selesai, s: "Dikembalikan", oleh: "Petugas gudang " + a.lokasi, catatan: "Kondisi saat kembali: baik." });
    peminjaman.push({
      id: "PJ-2026-" + String(18 - i).padStart(3, "0"), alatId: a.id, peminjam: PEMINJAM[i % PEMINJAM.length],
      pekerjaan: PEKERJAAN[i % PEKERJAAN.length], tujuan: ["GI 150KV GILITIMUR", "GI 150KV SENGKALING", "GI 150KV NGORO", "GISTET 500KV PAITON", "GI 150KV KALISARI", "GITET 500KV KRIAN"][i % 6],
      mulai, selesai, status: st, pic: ["Andi P.", "Budi S.", "Citra W.", "Dimas R.", "Eka F.", "Fajar N."][i % 6], histori: hist
    });
  }
  window.ALAT_BERAT_DUMMY = { alat, peminjaman, generated: "dummy" };
})();
