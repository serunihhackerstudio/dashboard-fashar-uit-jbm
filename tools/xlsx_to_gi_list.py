"""Konversi daftar GI/GIS (LIST_GI_SE_UIT_JBM.xlsx, sheet 'DAFTAR NAMA GI') -> data/gi-uit-jbm.js

Pemakaian:
    python3 tools/xlsx_to_gi_list.py "LIST_GI_SE_UIT_JBM.xlsx"
"""
import json, sys, openpyxl

def main(path, out="data/gi-uit-jbm.js"):
    ws = openpyxl.load_workbook(path, data_only=True)["DAFTAR NAMA GI"]
    seen, data = set(), []
    for upt, ultg, gi, *_ in ws.iter_rows(min_row=2, values_only=True):
        if not (upt and gi): continue
        rec = {"upt": " ".join(str(upt).split()).upper(), "ultg": " ".join(str(ultg or "").split()),
               "gi": " ".join(str(gi).split()).upper()}
        key = (rec["upt"], rec["gi"])
        if key in seen: continue
        seen.add(key); data.append(rec)
    data.sort(key=lambda r: (r["upt"], r["ultg"], r["gi"]))
    with open(out, "w", encoding="utf-8") as f:
        f.write("/* Dibuat otomatis oleh tools/xlsx_to_gi_list.py dari sheet 'DAFTAR NAMA GI'. Jangan diedit manual. */\n")
        f.write("window.GI_UIT_JBM = ")
        json.dump(data, f, ensure_ascii=False, indent=0)
        f.write(";\n")
    print(f"{len(data)} GI -> {out}")

if __name__ == "__main__":
    main(sys.argv[1])
