"""Konversi sheet "7. ALAT HV TEST" (DATABASE ALAT BERAT UIT JBM) -> data/hv-test.js (data cadangan)

Pemakaian:
    python3 tools/xlsx_hv_test_to_js.py "HV_TEST.xlsx"

Data live dibaca dashboard langsung dari Google Sheets lewat Apps Script (?action=hv);
file ini hanya dipakai bila Apps Script tidak dapat diakses.
"""
import datetime, json, os, sys
import openpyxl

SHEET = "7. ALAT HV TEST"
HEAD = {"NO": "no", "NAMA ALAT": "nama", "MEREK": "merk", "TIPE": "tipe", "KONDISI": "kondisi", "TAHUN": "tahun",
        "LOKASI": "lokasi", "KETERANGAN": "keterangan", "INSTRUKSI KERJA": "ik"}


def txt(v):
    if v is None:
        return None
    if isinstance(v, float) and v.is_integer():
        v = int(v)
    s = "\n".join(line.strip() for line in str(v).replace("\r", "").split("\n")).strip()
    while "\n\n\n" in s:
        s = s.replace("\n\n\n", "\n\n")
    return s or None


def main(path, out="data/hv-test.js"):
    ws = openpyxl.load_workbook(path)[SHEET]
    head = [str(ws.cell(1, c).value or "").strip().upper() for c in range(1, ws.max_column + 1)]
    col = {HEAD[h]: i + 1 for i, h in enumerate(head) if h in HEAD}
    rows = []
    for r in range(2, ws.max_row + 1):
        nama = txt(ws.cell(r, col["nama"]).value)
        if not nama:
            continue
        o = {"_row": r}
        for k, c in col.items():
            o[k] = txt(ws.cell(r, c).value)
        link = ws.cell(r, col["ik"]).hyperlink if "ik" in col else None
        o["ikUrl"] = link.target if link and link.target else None
        rows.append(o)
    doc = {"source": f"{os.path.basename(path)} — {SHEET}", "generated": datetime.date.today().isoformat(), "rows": rows}
    with open(out, "w", encoding="utf-8") as f:
        f.write("/* Dibuat otomatis oleh tools/xlsx_hv_test_to_js.py. Data cadangan; data live dari Google Sheets. */\n")
        f.write("window.HV_TEST = ")
        json.dump(doc, f, ensure_ascii=False, indent=1)
        f.write(";\n")
    print(f"{len(rows)} alat HV test -> {out}")


if __name__ == "__main__":
    main(sys.argv[1])
