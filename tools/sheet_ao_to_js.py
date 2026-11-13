"""Ambil sheet "MONITORING AO" (spreadsheet RKAU) -> data/ao.js (data cadangan menu AO)

Pemakaian:
    python3 tools/sheet_ao_to_js.py

Dashboard membaca sheet ini langsung (live) lewat Google Visualization API; file ini hanya
dipakai bila spreadsheet tidak dapat diakses. Spreadsheet harus dibagikan "Anyone with the link".
"""
import datetime, json, re, urllib.parse, urllib.request

SHEET_ID = "1RpPBoPXkaPu98nO41LXEuttQi8YkP3AO6xSPRmg-0M0"
SHEET = "MONITORING AO"


def main(out="data/ao.js"):
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:json&sheet={urllib.parse.quote(SHEET)}"
    txt = urllib.request.urlopen(url, timeout=30).read().decode("utf-8")
    data = json.loads(txt[txt.index("(") + 1: txt.rindex(")")])
    rows = []
    for r in data["table"]["rows"]:
        c = [(x or {}) for x in r["c"]]
        val = lambda i: c[i].get("v") if i < len(c) else None
        if not val(2) and not val(1):
            continue
        rows.append({"no": val(0), "proker": val(1), "judul": val(2), "rab": val(3), "kontrak": val(4),
                     "status": val(5), "progres": val(6), "noKontrak": val(8)})
    doc = {"sheetId": SHEET_ID, "sheet": SHEET, "generated": datetime.date.today().isoformat(), "rows": rows}
    with open(out, "w", encoding="utf-8") as f:
        f.write("/* Dibuat otomatis oleh tools/sheet_ao_to_js.py (data cadangan; data live dibaca dari spreadsheet). */\n")
        f.write("window.AO_DATA = ")
        json.dump(doc, f, ensure_ascii=False, indent=1)
        f.write(";\n")
    print(f"{len(rows)} program kerja -> {out}")


if __name__ == "__main__":
    main()
