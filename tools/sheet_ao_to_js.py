"""Ambil sheet "MONITORING AO" (spreadsheet RKAU) -> data/ao.js (data cadangan menu AO)

Pemakaian:
    python3 tools/sheet_ao_to_js.py

Dashboard membaca sheet ini langsung (live) lewat Google Visualization API; file ini hanya
dipakai bila spreadsheet tidak dapat diakses. Spreadsheet harus dibagikan "Anyone with the link".
"""
import datetime, json, re, urllib.parse, urllib.request

SHEET_ID = "1RpPBoPXkaPu98nO41LXEuttQi8YkP3AO6xSPRmg-0M0"
SHEET = "MONITORING AO"
PAGU_SHEET = "PROGRES PAGU"


def gviz(sheet):
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:json&sheet={urllib.parse.quote(sheet)}"
    txt = urllib.request.urlopen(url, timeout=30).read().decode("utf-8")
    return json.loads(txt[txt.index("(") + 1: txt.rindex(")")])


def pagu_rows():
    """PROGRES PAGU: NO, PROGRAM, PAGU, REALISASI, rincian pekerjaan (kolom E..sebelum SISA), SISA"""
    d = gviz(PAGU_SHEET)
    cols = [str(c.get("label") or "").strip() for c in d["table"]["cols"]]
    up = [c.upper() for c in cols]
    sisa_i = up.index("SISA") if "SISA" in up else len(cols)
    out = []
    for r in d["table"]["rows"]:
        c = [(x or {}).get("v") for x in r["c"]]
        if not isinstance(c[0], (int, float)) or not c[1]:
            continue
        det = [{"pekerjaan": cols[i], "nilai": c[i]} for i in range(4, sisa_i) if i < len(c) and cols[i] and isinstance(c[i], (int, float)) and c[i]]
        out.append({"no": c[0], "program": str(c[1]).strip(), "pagu": c[2], "realisasi": c[3], "rincian": det})
    return out


def main(out="data/ao.js"):
    data = gviz(SHEET)
    rows = []
    for r in data["table"]["rows"]:
        c = [(x or {}) for x in r["c"]]
        val = lambda i: c[i].get("v") if i < len(c) else None
        if not val(2) and not val(1):
            continue
        rows.append({"no": val(0), "proker": val(1), "judul": val(2), "rab": val(3), "kontrak": val(4),
                     "status": val(5), "progres": val(6), "noKontrak": val(8)})
    doc = {"sheetId": SHEET_ID, "sheet": SHEET, "paguSheet": PAGU_SHEET, "generated": datetime.date.today().isoformat(), "rows": rows, "pagu": pagu_rows()}
    with open(out, "w", encoding="utf-8") as f:
        f.write("/* Dibuat otomatis oleh tools/sheet_ao_to_js.py (data cadangan; data live dibaca dari spreadsheet). */\n")
        f.write("window.AO_DATA = ")
        json.dump(doc, f, ensure_ascii=False, indent=1)
        f.write(";\n")
    print(f"{len(rows)} program kerja, {len(doc['pagu'])} baris pagu -> {out}")


if __name__ == "__main__":
    main()
