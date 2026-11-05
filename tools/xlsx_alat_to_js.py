"""Konversi export aplikasi alat (sheet pertama, header no, id_alat, unit, ...) -> data/<nama>.js

Pemakaian:
    python3 tools/xlsx_alat_to_js.py "DATA_DC_MOBILE_UIT_JBM.xlsx" data/dc-mobile.js DC_MOBILE
    python3 tools/xlsx_alat_to_js.py "FILTER_MINYAK_UIT_JBM.xlsx"  data/filter-minyak.js FILTER_MINYAK

Kolom yang dibaca mengikuti header baris 1 (no, id_alat, unit, subunit, ..., no_kontrak).
Nilai kosong / "0000-00-00" / "Tidak tersedia" / "-" / 0 dianggap tidak ada data.
"""
import datetime, json, os, sys, openpyxl

FIELDS = {  # header excel -> kunci di dashboard
    "no": "no", "id_alat": "id", "unit": "upt", "subunit": "ultg", "gardu_induk": "gi", "kategori": "kategori",
    "sub_kategori": "subKategori", "nama": "nama", "nama_alat_tsj": "namaTsj", "bidang": "bidang", "merk": "merk",
    "type": "tipe", "satuan": "satuan", "jumlah": "jumlah", "tahun_perolehan": "tahun", "serial_number": "sn",
    "status_kalibrasi": "kalibrasi", "sertifikat_kalibrasi": "sertifikat", "tgl_kalibrasi_terakhir": "tglKalibrasi",
    "tgl_kadaluarsa": "tglKadaluarsa", "rencana_kalibrasi": "rencanaKalibrasi", "jenis_lembaga_kalibrasi": "jenisLembaga",
    "nama_lembaga_kalibrasi": "lembaga", "kondisi": "kondisi", "kondisi_perbaikan": "kondisiPerbaikan", "anomali": "anomali",
    "keterangan": "keterangan", "lokasi": "lokasi", "created_at": "dibuat", "created_by": "dibuatOleh", "nama_file": "namaFile",
    "harga_perolehan": "harga", "file_ik": "fileIk", "updated_at": "diperbarui", "no_aktifa": "noAktiva", "no_kontrak": "noKontrak",
}
EMPTY = {"", "-", "0", "0000-00-00", "0000-00-00 00:00:00", "tidak tersedia", "none", "n/a", "na"}


def clean(v):
    if v is None:
        return None
    if isinstance(v, datetime.datetime):
        return v.strftime("%Y-%m-%d %H:%M")
    if isinstance(v, datetime.date):
        return v.isoformat()
    if isinstance(v, float) and v.is_integer():
        v = int(v)
    s = " ".join(str(v).split())
    return None if s.lower() in EMPTY else s


def main(path, out, var):
    ws = openpyxl.load_workbook(path, data_only=True).worksheets[0]
    rows = ws.iter_rows(values_only=True)
    head = [str(h or "").strip().lower() for h in next(rows)]
    data = []
    for r in rows:
        rec = {FIELDS[h]: clean(v) for h, v in zip(head, r) if h in FIELDS}
        if not (rec.get("id") or rec.get("nama")):
            continue
        rec["jumlah"] = int(rec["jumlah"]) if rec.get("jumlah") and str(rec["jumlah"]).isdigit() else 1
        if rec.get("upt"):
            rec["upt"] = rec["upt"].upper()
        data.append(rec)
    data.sort(key=lambda d: (d.get("upt") or "", d.get("ultg") or "", d.get("id") or ""))
    stamps = sorted(v[:10] for d in data for v in (d.get("diperbarui"), d.get("dibuat")) if v)
    doc = {"source": os.path.basename(path), "diperbarui": stamps[-1] if stamps else None, "rows": data}
    with open(out, "w", encoding="utf-8") as f:
        f.write("/* Dibuat otomatis oleh tools/xlsx_alat_to_js.py. Jangan diedit manual. */\n")
        f.write(f"window.{var} = ")
        json.dump(doc, f, ensure_ascii=False, indent=1)
        f.write(";\n")
    print(f"{len(data)} unit -> {out} (window.{var})")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3])
