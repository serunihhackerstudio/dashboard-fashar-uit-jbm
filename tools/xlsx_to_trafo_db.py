"""Konversi sheet '2. TRAFO MOBILE' (DATABASE ALAT BERAT UIT JBM.xlsx) -> data/trafo-mobile-db.js

Pemakaian:
    python3 tools/xlsx_to_trafo_db.py "DATABASE_ALAT_BERAT_UIT_JBM.xlsx"

Catatan: kolom nilai aset & referensi kontrak sengaja TIDAK diekspor karena
dashboard di-hosting publik.
"""
import json, sys, datetime, openpyxl

SHEET = "2. TRAFO MOBILE"
# indeks kolom (0-based) sesuai header sheet
COL = dict(no=0, komponen=1, sn=2, merk=3, kv=4, mva=5, upt=6, gi=7, tahun=8, status=9,
           keterangan=10, anomali=11, tindakLanjut=12, statusAnomali=13, namaAset=15, identitas=22, powerInspect=27)

def clean(v):
    if v is None: return None
    if isinstance(v, float) and v.is_integer(): v = int(v)
    if isinstance(v, (datetime.date, datetime.datetime)): return v.strftime("%Y-%m-%d")
    s = str(v).strip()
    return s or None

def main(path, out="data/trafo-mobile-db.js"):
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb[SHEET]
    rows = [list(r) for r in ws.iter_rows(values_only=True)]
    # isi nilai sel gabungan (merged) ke semua baris dalam rentangnya
    for m in ws.merged_cells.ranges:
        v = rows[m.min_row - 1][m.min_col - 1]
        for r in range(m.min_row, m.max_row + 1):
            for c in range(m.min_col, m.max_col + 1):
                rows[r - 1][c - 1] = v
    data = []
    for r in rows[2:]:  # 2 baris header
        rec = {k: clean(r[i]) if i < len(r) else None for k, i in COL.items()}
        if not rec["komponen"]: continue
        rec["status"] = (rec["status"] or "BELUM DIPASTIKAN").upper()
        rec["powerInspect"] = rec["powerInspect"] == "✅"
        if rec["namaAset"]: rec["namaAset"] = rec["namaAset"].replace("–", "-")
        for k in ("kv", "mva", "sn", "no", "tahun"):
            if rec[k] is not None: rec[k] = str(rec[k])
        data.append(rec)
    with open(out, "w", encoding="utf-8") as f:
        f.write("/* Dibuat otomatis oleh tools/xlsx_to_trafo_db.py dari sheet '%s'. Jangan diedit manual. */\n" % SHEET)
        f.write("window.TRAFO_DB = ")
        json.dump({"source": "DATABASE ALAT BERAT UIT JBM — " + SHEET, "generated": datetime.date.today().isoformat(), "rows": data}, f, ensure_ascii=False, indent=1)
        f.write(";\n")
    print(f"{len(data)} baris -> {out}")

if __name__ == "__main__":
    main(sys.argv[1])
