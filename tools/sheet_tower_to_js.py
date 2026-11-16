"""Ambil data Tower Emergency (TE) dari spreadsheet "DATA TOWER EMERGENCY" -> data/tower-emergency.js
beserta foto item -> assets/tower/<hash>.jpg

Pemakaian:
    python3 tools/sheet_tower_to_js.py            # unduh ulang dari Google Sheets
    python3 tools/sheet_tower_to_js.py --cache DIR  # pakai file htmlview yang sudah diunduh (h_<gid>.html)

Sumber dibaca dari tampilan HTML spreadsheet (htmlview) agar sel gabungan (NAMA KONTAINER),
kolom tersembunyi, dan gambar di dalam sel terbaca sama seperti yang terlihat di Google Sheets.
Spreadsheet harus dapat dibuka dengan link ("Anyone with the link – Viewer").
Kolom bertajuk NAMA KONTAINER menjadi acuan: setiap sub-kolom di bawahnya = satu kontainer.
"""
import datetime, hashlib, html, io, json, os, re, subprocess, sys, time
from html.parser import HTMLParser

SHEET_ID = "1P92IKcPwqLltC4sY_L3BcezIYiuwA0qKnGX6McyZ-6Y"
# gid, nama sheet, info lokasi (titik peta perkiraan)
SHEETS = [
    ("921593795", "LINDSEY BANGIL", {"lokasi": "GIS Bangil", "merk": "Lindsey", "lat": -7.600, "lng": 112.780}),
    ("1287518963", "TS BABAT", {"lokasi": "GI Babat", "merk": "TS", "lat": -7.112, "lng": 112.163}),
    ("1567974116", "LINDSEY PACITAN", {"lokasi": "GI Pacitan", "merk": "Lindsey", "lat": -8.195, "lng": 111.105}),
    ("1033846467", "TS TANDES", {"lokasi": "Gudang Tandes", "merk": "TS", "lat": -7.250, "lng": 112.676}),
    ("819924374", "TS TANAH LOT", {"lokasi": "GIS Tanah Lot", "merk": "TS", "lat": -8.615, "lng": 115.090}),
    ("865271373", "SBB KEBONAGUNG", {"lokasi": "GI Kebonagung", "merk": "SBB", "lat": -8.010, "lng": 112.625}),
]
IMG_DIR = "assets/tower"


class Grid(HTMLParser):
    """Tabel htmlview -> grid baris x kolom (sel gabungan hanya diisi di sel asalnya)."""
    def __init__(self):
        super().__init__(); self.rows = []; self.cur = None; self.cell = None

    def handle_starttag(self, t, a):
        a = dict(a)
        if t == "tr": self.cur = []
        elif t == "td" and self.cur is not None and "freezebar" not in (a.get("class") or ""):
            self.cell = {"t": "", "cs": int(a.get("colspan", 1)), "rs": int(a.get("rowspan", 1)), "img": []}
        elif t == "img" and self.cell is not None: self.cell["img"].append(a.get("src"))
        elif t == "br" and self.cell is not None: self.cell["t"] += "\n"

    def handle_endtag(self, t):
        if t == "td" and self.cell is not None: self.cur.append(self.cell); self.cell = None
        elif t == "tr" and self.cur is not None: self.rows.append(self.cur); self.cur = None

    def handle_data(self, d):
        if self.cell is not None: self.cell["t"] += d

    def grid(self):
        G = {}
        for ri, r in enumerate(self.rows):
            ci = 0
            for c in r:
                while (ri, ci) in G: ci += 1
                for dr in range(c["rs"]):
                    for dc in range(c["cs"]):
                        G[(ri + dr, ci + dc)] = {"t": c["t"].strip(), "img": c["img"], "o": dr == 0 and dc == 0, "cs": c["cs"]}
                ci += c["cs"]
        if not G: return []
        mr = max(k[0] for k in G) + 1; mc = max(k[1] for k in G) + 1
        return [[G.get((r, c)) for c in range(mc)] for r in range(mr)]


def fetch(url):
    for k in range(5):
        b = subprocess.run(["curl", "-sS", "-L", "--max-time", "90", url], capture_output=True).stdout
        if len(b) > 200: return b
        time.sleep(2 + 3 * k)
    raise RuntimeError("Gagal mengunduh " + url[:90])


def num(s):
    s = (s or "").strip().replace(" ", "")
    if re.fullmatch(r"\d{1,3}([.,]\d{3})+", s): return float(re.sub(r"[.,]", "", s))
    if re.fullmatch(r"-?\d+([.,]\d+)?", s): return float(s.replace(",", "."))
    return None


def clean(s): return re.sub(r"[ \t]+", " ", (s or "").replace("\xa0", " ")).strip()


def parse_sheet(G, name):
    txt = lambda r, c: clean(G[r][c]["t"]) if r < len(G) and c < len(G[r]) and G[r][c] else ""
    up = lambda r, c: txt(r, c).upper()
    # untuk baris data hanya sel asal yang dibaca (isi sel gabungan tidak digandakan)
    txo = lambda r, c: txt(r, c) if c is not None and r < len(G) and c < len(G[r]) and G[r][c] and G[r][c]["o"] else ""
    # baris judul kolom = baris yang memuat SATUAN
    hr = next(r for r in range(len(G)) if any(up(r, c) == "SATUAN" for c in range(len(G[r]))))
    # baris NAMA KONTAINER (bisa di baris judul atau di atasnya) -> nama kontainer di baris bawahnya
    kr = next(r for r in range(max(0, hr - 3), hr + 2) if any(up(r, c) == "NAMA KONTAINER" for c in range(len(G[r]))))
    kcols = [c for c in range(len(G[kr])) if up(kr, c) == "NAMA KONTAINER"]
    nr = kr + 1
    while all(up(nr, c) in ("", "NAMA KONTAINER") for c in kcols): nr += 1
    containers = [(c, txt(nr, c).title()) for c in kcols if txt(nr, c) and up(nr, c) != "NAMA KONTAINER"]
    first = max(hr, nr) + 1
    # kolom lain berdasarkan judul (baris hr..nr)
    head = {}
    for c in range(len(G[hr])):
        for r in range(hr, nr + 1):
            h = up(r, c)
            if h and h != "NAMA KONTAINER" and c not in kcols: head.setdefault(c, h)
    col = lambda *keys: next((c for c, h in head.items() if any(h.startswith(k) for k in keys)), None)
    c_no, c_sat = col("ITEM NO", "NO"), col("SATUAN")
    c_part = col("LINDSEY PART", "SBB PART")
    c_desc = col("DESCRIPTION", "URAIAN")
    c_ts = col("NAMA TS")
    c_foto = col("FOTO", "GAMBAR")
    c_tot = col("TOTAL", "JUMLAH")
    c_ket = col("KETERANGAN", "KETERANGA")
    used = {c_no, c_sat, c_part, c_desc, c_ts, c_foto, c_tot, c_ket} | set(kcols)
    extra = [(c, h.title()) for c, h in head.items() if c not in used]
    label_col = c_desc if c_desc is not None else c_part

    items, cat, notes = [], "Lainnya", []
    for r in range(first, len(G)):
        name_, part, ts, sat = txo(r, c_desc), txo(r, c_part), txo(r, c_ts), txo(r, c_sat)
        q = {k: num(txo(r, c)) for c, k in containers}
        tot = num(txo(r, c_tot))
        ket = txo(r, c_ket)
        ex = {lab: txo(r, c) for c, lab in extra if txo(r, c)}
        cell_f = G[r][c_foto] if c_foto is not None and c_foto < len(G[r]) else None
        img = cell_f["img"][0] if cell_f and cell_f["img"] and cell_f["o"] else None
        has_num = any(v is not None for v in q.values()) or tot is not None
        label = name_ or part
        if not label and not has_num: continue
        if not sat and not has_num and not img:
            # judul kategori (teks biasa) atau catatan
            lab = clean(label)
            if re.match(r"each\s+set\s+consists?", lab, re.I): continue
            if re.search(r"exist|standar|kontainer", lab, re.I) and items: notes.append(lab); continue
            cat = lab[:80]; continue
        if not label: continue
        qty = {k: v for k, v in q.items() if v}
        if not qty and tot and len(containers) == 1: qty = {containers[0][1]: tot}  # kolom kontainer kosong, jumlah ada di TOTAL
        total = tot if tot is not None else sum(qty.values())
        items.append({"kat": cat, "nama": label, "part": part if c_desc is not None else "", "ts": ts, "satuan": sat.upper(),
                      "q": qty, "total": total, "ket": ket, "extra": ex, "img": img})
    return {"containers": [k for _, k in containers], "items": items, "notes": notes,
            "title": next((txt(r, 0) for r in range(first) if txt(r, 0) and len(txt(r, 0)) > 6 and "PLN" not in up(r, 0) and up(r, 0) not in ("ITEM NO.", "NO")), name)}


def main():
    cache = sys.argv[sys.argv.index("--cache") + 1] if "--cache" in sys.argv else None
    os.makedirs(IMG_DIR, exist_ok=True)
    from PIL import Image
    imgmap = {}

    def save_img(u):
        if not u or "--noimg" in sys.argv: return u if u and "--noimg" in sys.argv else None
        if u in imgmap: return imgmap[u]
        for k in range(3):
            try:
                b = fetch(u)
                im = Image.open(io.BytesIO(b)).convert("RGBA"); bg = Image.new("RGB", im.size, (255, 255, 255)); bg.paste(im, mask=im.split()[3])
                bg.thumbnail((480, 480)); out = io.BytesIO(); bg.save(out, "JPEG", quality=82, optimize=True); data = out.getvalue()
                h = hashlib.sha1(data).hexdigest()[:12]
                p = f"{IMG_DIR}/{h}.jpg"
                if not os.path.exists(p): open(p, "wb").write(data)
                imgmap[u] = p; return p
            except Exception:
                time.sleep(2 + 3 * k)
        imgmap[u] = None; return None

    lokasi = []
    for gid, name, info in SHEETS:
        if cache: raw = open(os.path.join(cache, f"h_{gid}.html"), encoding="utf-8").read()
        else: raw = fetch(f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/htmlview/sheet?headers=false&gid={gid}").decode("utf-8")
        p = Grid(); p.feed(raw); d = parse_sheet(p.grid(), name)
        for it in d["items"]: it["img"] = save_img(it["img"])
        lokasi.append({"sheet": name, "gid": gid, **info, **d})
        print(f"{name}: {len(d['containers'])} kontainer {d['containers']}, {len(d['items'])} item, foto {sum(1 for i in d['items'] if i['img'])}")
    doc = {"sheetId": SHEET_ID, "generated": datetime.date.today().isoformat(), "lokasi": lokasi}
    with open("data/tower-emergency.js", "w", encoding="utf-8") as f:
        f.write("/* Dibuat otomatis oleh tools/sheet_tower_to_js.py dari spreadsheet DATA TOWER EMERGENCY. */\n")
        f.write("window.TOWER_TE = "); json.dump(doc, f, ensure_ascii=False, separators=(",", ":")); f.write(";\n")
    print("-> data/tower-emergency.js")


if __name__ == "__main__":
    main()
