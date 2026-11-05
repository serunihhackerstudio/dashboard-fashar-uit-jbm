"""Konversi export CUI Jarvis (.xls berformat HTML) -> data/cui-jarvis.js

Pemakaian:
    python3 tools/jarvis_to_js.py "Jarvis_per_5_Nov_2026.xls"

Data disimpan ringkas (kode kamus per kolom) agar file kecil.
"""
import datetime, html.parser, json, sys

FIELDS = [  # (kunci, judul kolom di export)
    ("upt", "Upt"), ("ultg", "Ultg"), ("gi", "Gi"), ("penghantar", "Penghantar"), ("lokasi", "Lokasi"), ("clamp", "Clamp"),
    ("tanggal", "Tanggal Inspeksi"), ("tipe", "Tipe Tower"),
    ("halaman", "Halaman Tower"), ("acd", "Acd"), ("chimney", "Chimney"), ("stub", "Stub"), ("nomor", "Nomor Tower"),
    ("plat", "Plat Tanda Bahaya"), ("stepbolt", "Step Bolt"), ("row", "Right Of Way"),
    ("isolator", "Isolator"), ("aksCold", "Aksesoris Sisi Cold"), ("aksHot", "Aksesoris Sisi Hot"), ("konduktor", "Konduktor"), ("gap", "Gap Arching"),
    ("ewKond1", "Konduktor Earth Wire Line 1"), ("ewKond2", "Konduktor Earth Wire Line 2"), ("ewAks1", "Aksesoris Earth Wire Line 1"), ("ewAks2", "Aksesoris Earth Wire Line 2"),
    ("ket", "Keterangan"),
]

class Table(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(); self.rows = []; self.row = None; self.cell = None; self.span = 1
    def handle_starttag(self, t, a):
        if t == "tr": self.row = []
        elif t in ("td", "th"): self.cell = []; self.span = int(dict(a).get("colspan") or 1)
        elif t == "br" and self.cell is not None: self.cell.append(" ")
    def handle_endtag(self, t):
        if t in ("td", "th") and self.cell is not None:
            self.row.append(" ".join("".join(self.cell).split())); self.row.extend([""] * (self.span - 1)); self.cell = None
        elif t == "tr" and self.row is not None: self.rows.append(self.row); self.row = None
    def handle_data(self, d):
        if self.cell is not None: self.cell.append(d)

def iso(v):
    for f in ("%d-%b-%y", "%d-%b-%Y", "%d/%m/%Y", "%Y-%m-%d"):
        try: return datetime.datetime.strptime(v.strip().title(), f).strftime("%Y-%m-%d")
        except ValueError: pass
    return v.strip()

def main(path, out="data/cui-jarvis.js"):
    p = Table(); p.feed(open(path, encoding="utf-8", errors="replace").read())
    head_i = next(i for i, r in enumerate(p.rows) if "Penghantar" in r and "Lokasi" in r)
    head = p.rows[head_i]
    idx = {k: head.index(h) for k, h in FIELDS if h in head}
    missing = [h for k, h in FIELDS if k not in idx]
    if missing: print("Peringatan: kolom tidak ditemukan:", missing)
    keys = [k for k, _ in FIELDS if k in idx]
    dicts = {k: [] for k in keys}; look = {k: {} for k in keys}; rows = []
    for r in p.rows[head_i + 1:]:
        if len(r) < len(head) or not r[idx["lokasi"]].strip(): continue
        enc = []
        for k in keys:
            v = r[idx[k]].strip()
            if k == "tanggal": v = iso(v)
            if v not in look[k]: look[k][v] = len(dicts[k]); dicts[k].append(v)
            enc.append(look[k][v])
        rows.append(enc)
    dates = sorted(dicts["tanggal"][x[keys.index("tanggal")]] for x in rows)
    doc = {"source": path.split("/")[-1], "generated": datetime.date.today().isoformat(),
           "periode": [dates[0], dates[-1]] if dates else None, "keys": keys, "dict": dicts, "rows": rows}
    with open(out, "w", encoding="utf-8") as f:
        f.write("/* Dibuat otomatis oleh tools/jarvis_to_js.py dari export CUI Jarvis. Jangan diedit manual. */\n")
        f.write("window.CUI_JARVIS = "); json.dump(doc, f, ensure_ascii=False, separators=(",", ":")); f.write(";\n")
    print(f"{len(rows)} baris, {len(set(x[keys.index('lokasi')] for x in rows))} tower -> {out}")

if __name__ == "__main__":
    main(sys.argv[1])
