"""Konversi export inventaris alat berat dari aplikasi WARNOTO -> data/alat-berat.js (+ foto)

Pemakaian:
    python3 tools/xlsx_alat_berat_to_js.py "Alat_Berat_UIT-JBM_2026-11-06.xlsx"

- Sheet "Inventaris": satu baris per alat (ID, UPT, Gudang/Lokasi, Nama, Jenis, Kategori, ...).
- Sheet "Lampiran Foto": foto tertanam per baris ID -> assets/alat-berat/<ID>.jpg
- Tanggal data diambil dari nama file (..._YYYY-MM-DD.xlsx), bila ada.
"""
import datetime, io, json, os, re, sys
import openpyxl

OUT_JS = "data/alat-berat.js"
OUT_FOTO = "assets/alat-berat"
BULAN = {"jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "mei": 5, "jun": 6, "jul": 7, "aug": 8, "agu": 8, "agt": 8,
         "sep": 9, "oct": 10, "okt": 10, "nov": 11, "dec": 12, "des": 12}
BULAN_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
KATEGORI = {"crane": "crane", "forklift": "forklift", "manlift": "manlift", "pendukung": "pendukung", "truck": "truck"}
ACRONYM = {"UPT", "ULTG", "PLTD", "GI", "GIS", "GITET", "II", "III"}
LOKASI_ALIAS = {"KETINTANG": "Gudang Ketintang"}
# Posisi perkiraan lokasi penyimpanan (untuk peta)
KOORDINAT = {
    "Gudang Ketintang": [-7.312, 112.727], "GI Sukolilo": [-7.289, 112.789], "Gudang Wonorejo": [-7.305, 112.803],
    "Kantor UPT Probolinggo": [-7.755, 113.215], "Gudang Bangil": [-7.600, 112.780], "Kapal": [-8.586, 115.165],
    "Gudang PLTD": [-7.630, 111.530], "Gudang PLTD / Gudang Dolopo": [-7.700, 111.515], "Gudang ULTG Babat": [-7.112, 112.163],
    "Gudang Tandes": [-7.255, 112.680], "Gudang Polehan": [-7.980, 112.645], "Gudang Krian": [-7.410, 112.580],
    "Gudang Mojokerto": [-7.470, 112.440],
}


def txt(v):
    if v is None:
        return None
    if isinstance(v, float) and v.is_integer():
        v = int(v)
    s = " ".join(str(v).split())
    return None if s in ("", "-", "None") else s


def title_case(s):
    if not s:
        return s
    if s != s.upper():
        return s
    return " ".join(w if w in ACRONYM else w.capitalize() for w in s.split(" "))


def kapasitas(v):
    v = txt(v)
    if v and re.fullmatch(r"\d{3,}", v):
        return f"{int(v):,}".replace(",", ".") + " KG"
    return v


def kondisi(status_alat, teks):
    s, t = (status_alat or "").upper(), (teks or "").upper()
    if s == "RUSAK":
        return "Rusak"
    if s == "PERLU_SERVICE" or "SERVICE" in t:
        return "Perlu Service"
    return "Baik"


def surat_izin(v, today):
    """-> (kategori, teks tampilan, url, tanggal berlaku ISO)"""
    v = txt(v)
    if not v or v.lower() in ("tidak ada", "belum ada"):
        return "Tidak ada", "Tidak ada", None, None
    if v.startswith("http"):
        return "Ada dokumen", "Dokumen surat izin tersedia", v, None
    if "PERPANJANG" in v.upper():
        return "Perlu perpanjangan", "Perlu perpanjangan", None, None
    m = re.fullmatch(r"(?:(\d{1,2}) )?([A-Za-z]+) (\d{4})", v)
    if m and m.group(2)[:3].lower() in BULAN:
        mon, yr = BULAN[m.group(2)[:3].lower()], int(m.group(3))
        day = int(m.group(1)) if m.group(1) else (datetime.date(yr + (mon == 12), mon % 12 + 1, 1) - datetime.timedelta(days=1)).day
        d = datetime.date(yr, mon, day)
        label = (f"{day} " if m.group(1) else "") + f"{BULAN_ID[mon - 1]} {yr}"
        if d < today:
            return "Kedaluwarsa", f"Kedaluwarsa ({label})", None, d.isoformat()
        return "Berlaku", f"Berlaku s.d. {label}", None, d.isoformat()
    return "Ada dokumen", v, None, None


def main(path):
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb["Inventaris"]
    rows = list(ws.iter_rows(values_only=True))
    head = [str(h or "").strip() for h in rows[0]]
    col = {h: i for i, h in enumerate(head)}
    g = lambda r, h: r[col[h]] if h in col and col[h] < len(r) else None
    m = re.search(r"(\d{4}-\d{2}-\d{2})", os.path.basename(path))
    generated = m.group(1) if m else datetime.date.today().isoformat()
    today = datetime.date.fromisoformat(generated)

    # foto tertanam di sheet "Lampiran Foto" (baris yang sama dengan ID-nya)
    fotos = {}
    if "Lampiran Foto" in wb.sheetnames:
        wf = wb["Lampiran Foto"]
        os.makedirs(OUT_FOTO, exist_ok=True)
        try:
            from PIL import Image
        except ImportError:
            Image = None
        for img in wf._images:
            r = img.anchor._from.row + 1
            fid = txt(wf.cell(row=r, column=1).value)
            if not fid:
                continue
            data = img._data()
            out = os.path.join(OUT_FOTO, f"{fid}.jpg")
            if Image:
                im = Image.open(io.BytesIO(data)).convert("RGB")
                im.thumbnail((900, 900))
                im.save(out, "JPEG", quality=82, optimize=True)
            else:
                out = os.path.join(OUT_FOTO, f"{fid}.png")
                open(out, "wb").write(data)
            fotos[fid] = out.replace(os.sep, "/")

    alat = []
    for r in rows[1:]:
        aid = txt(g(r, "ID"))
        if not aid:
            continue
        lok = txt(g(r, "Gudang/Lokasi")) or "Tanpa lokasi"
        lok = LOKASI_ALIAS.get(lok.upper(), title_case(lok))
        kat_src = (txt(g(r, "Kategori")) or "pendukung").lower()
        st_alat = (txt(g(r, "Status Alat")) or "").upper()
        ketersediaan = (txt(g(r, "Status Ketersediaan")) or "").upper()
        kond_teks = txt(g(r, "Kondisi"))
        kond = kondisi(st_alat, kond_teks)
        iz, iz_teks, iz_url, iz_tgl = surat_izin(g(r, "Surat Izin"), today)
        alat.append({
            "id": aid, "kategori": KATEGORI.get(kat_src, "pendukung"), "nama": txt(g(r, "Nama")),
            "merk": txt(g(r, "Merk/Type")), "tipe": "", "kapasitas": kapasitas(g(r, "Kapasitas")),
            "tahun": txt(g(r, "Tahun")), "noSeri": txt(g(r, "No. Seri")), "upt": txt(g(r, "UPT")), "lokasi": lok,
            "status": "Dipinjam" if ketersediaan == "DIPINJAM" else ("Perbaikan" if st_alat == "RUSAK" else "Tersedia"),
            "layak": st_alat == "LAYAK", "statusAlat": st_alat.replace("_", " ").title() if st_alat else None,
            "kondisi": kond, "kondisiCatatan": kond_teks if kond_teks and kond_teks.lower() != kond.lower() else None,
            "fungsi": title_case(txt(g(r, "Jenis")) or ""), "jenisAset": (txt(g(r, "Jenis Aset")) or "").replace("_", " ").title(),
            "spesifikasi": txt(g(r, "Spesifikasi")), "jumlah": g(r, "Jumlah") or 1, "satuan": txt(g(r, "Satuan")),
            "izin": iz, "suratIzin": iz_teks, "suratIzinUrl": iz_url, "izinBerlaku": iz_tgl, "terakhirDipinjam": None, "foto": fotos.get(aid),
        })
    lokasi = sorted({a["lokasi"] for a in alat})
    missing = [l for l in lokasi if l not in KOORDINAT]
    doc = {"source": os.path.basename(path), "sumber": "Aplikasi WARNOTO", "generated": generated,
           "alat": alat, "peminjaman": [], "koordinat": {l: KOORDINAT[l] for l in lokasi if l in KOORDINAT}}
    with open(OUT_JS, "w", encoding="utf-8") as f:
        f.write("/* Dibuat otomatis oleh tools/xlsx_alat_berat_to_js.py dari export aplikasi WARNOTO. Jangan diedit manual. */\n")
        f.write("window.ALAT_BERAT = ")
        json.dump(doc, f, ensure_ascii=False, indent=1)
        f.write(";\n")
    print(f"{len(alat)} alat, {len(fotos)} foto -> {OUT_JS}, {OUT_FOTO}/")
    if missing:
        print("PERINGATAN: lokasi tanpa koordinat (tambahkan ke KOORDINAT):", ", ".join(missing))


if __name__ == "__main__":
    main(sys.argv[1])
