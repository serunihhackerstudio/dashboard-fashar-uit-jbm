/**
 * FASHAR UIT JBM — API Database Trafo Mobile
 * ------------------------------------------------------------
 * Pasang skrip ini di spreadsheet DATABASE ALAT BERAT UIT JBM
 * (Extensions → Apps Script), lalu deploy sebagai Web app.
 * Panduan lengkap: README.md bagian "Edit Database Trafo Mobile".
 *
 * GET  <url>                         → daftar komponen (JSON)
 * GET  <url>?action=photos&row=N      → daftar foto komponen di baris N
 * POST <url> (text/plain) → {token, action, row, expect, ...}
 *      action: "add" | "update" | "photo_upload" | "photo_replace" | "photo_caption" | "photo_delete"
 *
 * Foto disimpan di Google Drive: satu subfolder per komponen di dalam folder PHOTO_ROOT_ID.
 * Link subfolder ditulis otomatis ke kolom LINK FOTO PERALATAN (kolom Y).
 *
 * GET mengirim semua kolom (termasuk informasi aset & riwayat lokasi) untuk
 * pop-up Detail. POST hanya mengubah kolom di EDITABLE.
 */
const SHEET_NAME = '2. TRAFO MOBILE';
const HEADER_ROWS = 2;
// nomor kolom (1 = A) sesuai header sheet
const COLS = {
  no: 1, komponen: 2, sn: 3, merk: 4, kv: 5, mva: 6, upt: 7, gi: 8, tahun: 9, status: 10,
  keterangan: 11, anomali: 12, tindakLanjut: 13, statusAnomali: 14, dokumenAnomali: 15, namaAset: 16,
  nomorTid: 17, nomorAsset: 18, nilaiAset1: 19, refAset1: 20, nilaiAset2: 21, refAset2: 22, identitas: 23,
  tanggalOperasi: 24, linkFoto: 25, linkNameplate: 26, linkPemeliharaan: 27, powerInspect: 28, lokasiAwal: 29
};
const LINKS = ['linkFoto', 'linkNameplate', 'linkPemeliharaan', 'dokumenAnomali'];
const RIWAYAT_COL = 30, TAHUN = [2020, 2021, 2022, 2023, 2024, 2025]; // AD.. : (LOKASI, BA) per tahun
const EDITABLE = ['no', 'komponen', 'sn', 'merk', 'kv', 'mva', 'upt', 'gi', 'tahun', 'status',
  'keterangan', 'anomali', 'tindakLanjut', 'statusAnomali', 'identitas', 'namaAset'];
const NUMERIC = ['no', 'mva', 'tahun'];
const TEXT = ['sn', 'kv', 'identitas']; // dipaksa teks agar "150/20" / "0119…" tidak diubah Sheets
const STATUSES = ['OPERASI', 'STANDBY', 'RUSAK', ''];
// Folder Google Drive tempat foto. Bisa diganti lewat Script Properties: PHOTO_FOLDER_ID
const PHOTO_ROOT_ID = '1JdXBnRUftLg5WbQxzbCKCTg_CkUIUZCi';
const PHOTO_MAX_BYTES = 10 * 1024 * 1024;

function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    if (p.action === 'photos') {
      const sh = sheet_(), r = checkRow_(sh, p.row, p.expect);
      const folder = photoFolder_(sh, r, false);
      return json_({ ok: true, folder: folder ? folder.getUrl() : null, photos: folder ? listPhotos_(folder) : [] });
    }
    return json_({ ok: true, source: 'DATABASE ALAT BERAT UIT JBM — ' + SHEET_NAME, rows: readRows_() });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const token = PropertiesService.getScriptProperties().getProperty('EDIT_TOKEN');
    if (!token) return json_({ ok: false, code: 'config', error: 'EDIT_TOKEN belum diatur di Script Properties.' });
    if (req.token !== token) return json_({ ok: false, code: 'auth', error: 'Kode akses edit salah.' });

    const sh = sheet_();
    const data = validate_(req.data || {});

    if (req.action === 'update') {
      const r = Number(req.row);
      if (!(r > HEADER_ROWS && r <= sh.getLastRow())) return json_({ ok: false, error: 'Baris tidak valid.' });
      const current = sh.getRange(r, COLS.komponen).getDisplayValue().trim();
      if (req.expect != null && current !== String(req.expect).trim()) {
        return json_({ ok: false, code: 'conflict', error: 'Baris ini sudah berubah di spreadsheet. Muat ulang data lalu coba lagi.' });
      }
      EDITABLE.forEach(k => { if (k in data) write_(sh, r, k, data[k]); });
      return json_({ ok: true, row: readRow_(sh, r) });
    }

    if (String(req.action || '').indexOf('photo_') === 0) return json_(photoAction_(sh, req));

    if (req.action === 'add') {
      const r = lastDataRow_(sh) + 1;
      EDITABLE.forEach(k => { if (k in data) write_(sh, r, k, data[k]); });
      return json_({ ok: true, row: readRow_(sh, r) });
    }
    return json_({ ok: false, error: 'Aksi tidak dikenal.' });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

/* ---------- foto (Google Drive) ---------- */
function checkRow_(sh, row, expect) {
  const r = Number(row);
  if (!(r > HEADER_ROWS && r <= sh.getLastRow())) throw new Error('Baris tidak valid.');
  const current = sh.getRange(r, COLS.komponen).getDisplayValue().trim();
  if (expect != null && expect !== '' && current !== String(expect).trim()) {
    throw new Error('Baris ini sudah berubah di spreadsheet. Muat ulang data lalu coba lagi.');
  }
  return r;
}

function photoRoot_() {
  const id = PropertiesService.getScriptProperties().getProperty('PHOTO_FOLDER_ID') || PHOTO_ROOT_ID;
  return DriveApp.getFolderById(id);
}

/* Subfolder foto komponen: dibaca dari kolom LINK FOTO, dibuat bila belum ada (create = true). */
function photoFolder_(sh, r, create) {
  const cell = sh.getRange(r, COLS.linkFoto);
  const rt = cell.getRichTextValue();
  const url = String((rt && rt.getLinkUrl()) || cell.getDisplayValue() || '').trim();
  const m = url.match(/folders\/([\w-]+)/);
  if (m) {
    try { return DriveApp.getFolderById(m[1]); }
    catch (err) { throw new Error('Folder foto pada kolom LINK FOTO PERALATAN tidak dapat diakses oleh skrip.'); }
  }
  if (url) throw new Error('Kolom LINK FOTO PERALATAN sudah berisi tautan lain (bukan folder Google Drive). Kosongkan dulu bila ingin memakai fitur foto.');
  if (!create) return null;
  const v = sh.getRange(r, 1, 1, COLS.gi).getDisplayValues()[0];
  const name = ['Baris ' + r, v[COLS.komponen - 1], v[COLS.sn - 1] && 'SN ' + v[COLS.sn - 1], v[COLS.gi - 1]].filter(String).join(' - ');
  const folder = photoRoot_().createFolder(name);
  write_(sh, r, 'linkFoto', folder.getUrl());
  return folder;
}

function photoInfo_(f) {
  const id = f.getId();
  return {
    id: id, name: f.getName(), caption: f.getDescription() || '', created: f.getDateCreated().toISOString(),
    updated: f.getLastUpdated().toISOString(), size: f.getSize(),
    thumb: 'https://drive.google.com/thumbnail?id=' + id + '&sz=w480',
    full: 'https://drive.google.com/thumbnail?id=' + id + '&sz=w1600',
    view: f.getUrl()
  };
}

function listPhotos_(folder) {
  const out = [], it = folder.getFiles();
  while (it.hasNext()) {
    const f = it.next();
    if (/^image\//.test(f.getMimeType())) out.push(photoInfo_(f));
  }
  return out.sort((a, b) => a.created < b.created ? -1 : 1);
}

function photoBlob_(req) {
  const mime = String(req.mime || '');
  if (!/^image\/(jpeg|png|webp|gif)$/.test(mime)) throw new Error('Format file harus berupa gambar (JPG/PNG/WEBP).');
  const bytes = Utilities.base64Decode(String(req.data || ''));
  if (!bytes.length) throw new Error('File foto kosong.');
  if (bytes.length > PHOTO_MAX_BYTES) throw new Error('Ukuran foto melebihi 10 MB.');
  const base = String(req.name || 'foto').replace(/[^\w.\- ]+/g, '_').slice(0, 80);
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss');
  return Utilities.newBlob(bytes, mime, stamp + '_' + base);
}

function photoInFolder_(folder, fileId) {
  const f = DriveApp.getFileById(String(fileId || ''));
  const parents = f.getParents();
  while (parents.hasNext()) if (parents.next().getId() === folder.getId()) return f;
  throw new Error('Foto tidak ditemukan di folder komponen ini.');
}

function photoAction_(sh, req) {
  const r = checkRow_(sh, req.row, req.expect);
  const caption = String(req.caption == null ? '' : req.caption).trim().slice(0, 500);
  if (req.action === 'photo_upload') {
    const folder = photoFolder_(sh, r, true);
    const f = folder.createFile(photoBlob_(req));
    if (caption) f.setDescription(caption);
    return { ok: true, folder: folder.getUrl(), photo: photoInfo_(f) };
  }
  const folder = photoFolder_(sh, r, false);
  if (!folder) throw new Error('Komponen ini belum memiliki folder foto.');
  const old = photoInFolder_(folder, req.fileId);
  if (req.action === 'photo_replace') {
    const f = folder.createFile(photoBlob_(req));
    f.setDescription(req.caption == null ? (old.getDescription() || '') : caption);
    old.setTrashed(true); // foto lama dipindah ke Sampah Drive (bisa dipulihkan)
    return { ok: true, folder: folder.getUrl(), photo: photoInfo_(f), replaced: old.getId() };
  }
  if (req.action === 'photo_caption') {
    old.setDescription(caption);
    return { ok: true, photo: photoInfo_(old) };
  }
  if (req.action === 'photo_delete') {
    old.setTrashed(true); // dipindah ke Sampah Drive (bisa dipulihkan 30 hari)
    return { ok: true, deleted: old.getId() };
  }
  return { ok: false, error: 'Aksi foto tidak dikenal.' };
}

/* ---------- helpers ---------- */
function sheet_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  if (!sh) throw new Error('Sheet "' + SHEET_NAME + '" tidak ditemukan.');
  return sh;
}

function validate_(d) {
  const out = {};
  EDITABLE.forEach(k => {
    if (!(k in d)) return;
    let v = d[k] == null ? '' : String(d[k]).trim();
    if (v.length > 2000) throw new Error('Isian "' + k + '" terlalu panjang.');
    out[k] = v;
  });
  if ('komponen' in out && !out.komponen) throw new Error('Komponen wajib diisi.');
  if ('status' in out) {
    out.status = out.status.toUpperCase();
    if (STATUSES.indexOf(out.status) < 0) throw new Error('Status tidak valid.');
  }
  if (out.tahun && !/^\d{4}$/.test(out.tahun)) throw new Error('Tahun harus 4 digit.');
  if (out.mva && !/^\d+([.,]\d+)?$/.test(out.mva)) throw new Error('Kapasitas (MVA) harus angka.');
  return out;
}

function write_(sh, r, key, v) {
  let val = v;
  if (v === '') val = '';
  else if (NUMERIC.indexOf(key) >= 0 && /^\d+([.,]\d+)?$/.test(v)) val = Number(v.replace(',', '.'));
  else if (TEXT.indexOf(key) >= 0) val = /^[1-9]\d{0,14}$/.test(v) ? Number(v) : "'" + v;
  else if (/^[=+\-@]/.test(v)) val = "'" + v; // cegah isian dianggap rumus
  const cell = sh.getRange(r, COLS[key]);
  if (cell.isPartOfMerge()) {
    // sel gabungan (mis. Nama aset satu set unit): pisahkan dulu, isi semua baris dengan nilai lama,
    // lalu ubah hanya baris ini — baris lain dalam set tidak berubah.
    const m = cell.getMergedRanges()[0];
    const top = m.getCell(1, 1).getValue();
    m.breakApart();
    m.setValue(top);
  }
  cell.setValue(val);
}

function lastDataRow_(sh) {
  const n = sh.getLastRow();
  if (n <= HEADER_ROWS) return HEADER_ROWS;
  const vals = sh.getRange(HEADER_ROWS + 1, COLS.komponen, n - HEADER_ROWS, 1).getDisplayValues();
  for (let i = vals.length - 1; i >= 0; i--) if (String(vals[i][0]).trim()) return HEADER_ROWS + 1 + i;
  return HEADER_ROWS;
}

function readRows_() {
  const sh = sheet_();
  const last = lastDataRow_(sh);
  if (last <= HEADER_ROWS) return [];
  const width = RIWAYAT_COL - 1 + TAHUN.length * 2;
  const range = sh.getRange(HEADER_ROWS + 1, 1, last - HEADER_ROWS, width);
  const vals = range.getDisplayValues();
  const rich = range.getRichTextValues();
  // isi nilai sel gabungan ke semua baris dalam rentangnya
  range.getMergedRanges().forEach(m => {
    const r0 = m.getRow() - HEADER_ROWS - 1, c0 = m.getColumn() - 1;
    const top = m.getCell(1, 1).getDisplayValue();
    for (let r = 0; r < m.getNumRows(); r++) for (let c = 0; c < m.getNumColumns(); c++) {
      if (vals[r0 + r] && c0 + c < width) vals[r0 + r][c0 + c] = top;
    }
  });
  return vals.map((v, i) => {
    const rec = toRec_(v, HEADER_ROWS + 1 + i);
    LINKS.forEach(k => { const rt = rich[i][COLS[k] - 1]; const url = rt && rt.getLinkUrl(); if (url) rec[k] = url; });
    return rec;
  }).filter(r => r.komponen);
}

function readRow_(sh, r) {
  return readRows_().filter(x => x._row === r)[0] || null;
}

function toRec_(v, rowNum) {
  const rec = { _row: rowNum };
  Object.keys(COLS).forEach(k => {
    const s = String(v[COLS[k] - 1] == null ? '' : v[COLS[k] - 1]).trim();
    rec[k] = s || null;
  });
  rec.status = (rec.status || 'BELUM DIPASTIKAN').toUpperCase();
  if (rec.namaAset) rec.namaAset = rec.namaAset.replace(/–/g, '-');
  rec.powerInspect = rec.powerInspect === '✅';
  rec.riwayat = TAHUN.map((t, i) => ({
    tahun: t,
    lokasi: String(v[RIWAYAT_COL - 1 + i * 2] || '').trim() || null,
    ba: String(v[RIWAYAT_COL + i * 2] || '').trim() || null
  }));
  return rec;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
