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
 *              | "move_add" | "move_delete" | "ba_upload" | "cui_upload"
 * GET  <url>?action=cui              → data CUI Jarvis terbaru + riwayat unggahan
 *
 * CUI Jarvis: file export Jarvis yang diunggah dari dashboard disimpan permanen di
 * folder CUI_ROOT_ID (file asli + data ringkas JSON). Isi data terbaru juga ditulis
 * ke sheet CUI_DATA_SHEET dan setiap unggahan dicatat di sheet CUI_LOG_SHEET —
 * keduanya di spreadsheet DATABASE CUI JARVIS (CUI_SPREADSHEET_ID), terpisah dari
 * spreadsheet Trafo Mobile.
 *
 * Dokumen BA mobilisasi disimpan di folder BA_ROOT_ID dengan nama
 * "BA_Mobilisasi_[GI_ASAL]_ke_[GI_TUJUAN]_[tanggal_diupload]".
 *
 * Riwayat perpindahan disimpan di sheet MOVE_SHEET ("RIWAYAT LOKASI"), dibuat otomatis.
 * Setiap komponen diberi ID tetap (kolom ID DASHBOARD, kolom AP) sebagai penghubung riwayat.
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
  tanggalOperasi: 24, linkFoto: 25, linkNameplate: 26, linkPemeliharaan: 27, powerInspect: 28, lokasiAwal: 29,
  id: 42 // ID DASHBOARD (kolom AP), diisi otomatis
};
const ID_PREFIX = 'TM-';
const MOVE_SHEET = 'RIWAYAT LOKASI';
const MOVE_HEAD = ['ID RIWAYAT', 'TANGGAL PINDAH', 'ID KOMPONEN', 'KOMPONEN', 'SERIAL NUMBER', 'DARI UPT', 'DARI GARDU INDUK',
  'KE UPT', 'KE GARDU INDUK', 'ALASAN / KETERANGAN', 'NO / LINK BA', 'DICATAT PADA', 'SUMBER'];
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
// Folder Google Drive untuk dokumen BA mobilisasi. Bisa diganti lewat Script Properties: BA_FOLDER_ID
const BA_ROOT_ID = '1x2GoZITJm-Pf-yARe2vpGm0FU3s28SwT';
const BA_MAX_BYTES = 15 * 1024 * 1024;
const BA_MIME = {
  'application/pdf': '.pdf', 'image/jpeg': '.jpg', 'image/png': '.png',
  'application/msword': '.doc', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
};
// Folder Google Drive untuk file export CUI Jarvis. Bisa diganti lewat Script Properties: CUI_FOLDER_ID
const CUI_ROOT_ID = '1s7bQoZpSj4pTjk1RMmU79KN39pqiXEZb';
// Spreadsheet khusus database CUI Jarvis. Bisa diganti lewat Script Properties: CUI_SPREADSHEET_ID
const CUI_SPREADSHEET_ID = '1ZZIjI52Ea2Pg-LslfUGBvaHyqQLMDsf3JXkhIY4VPgc';
const CUI_LOG_SHEET = 'CUI JARVIS UPLOAD';
const CUI_DATA_SHEET = 'CUI JARVIS DATA';
const CUI_LOG_HEAD = ['ID UNGGAH', 'TANGGAL UNGGAH', 'WAKTU UNGGAH', 'NAMA FILE', 'JUMLAH KLEM', 'JUMLAH TOWER',
  'PERIODE AWAL', 'PERIODE AKHIR', 'LINK FILE ASLI', 'LINK DATA JSON', 'ID FILE JSON'];
const CUI_FIELDS = [['upt', 'UPT'], ['ultg', 'ULTG'], ['gi', 'GI'], ['penghantar', 'PENGHANTAR'], ['lokasi', 'LOKASI'], ['clamp', 'CLAMP'],
  ['tanggal', 'TANGGAL INSPEKSI'], ['tipe', 'TIPE TOWER'], ['halaman', 'HALAMAN TOWER'], ['acd', 'ACD'], ['chimney', 'CHIMNEY'], ['stub', 'STUB'],
  ['nomor', 'NOMOR TOWER'], ['plat', 'PLAT TANDA BAHAYA'], ['stepbolt', 'STEP BOLT'], ['row', 'RIGHT OF WAY'], ['isolator', 'ISOLATOR'],
  ['aksCold', 'AKSESORIS SISI COLD'], ['aksHot', 'AKSESORIS SISI HOT'], ['konduktor', 'KONDUKTOR'], ['gap', 'GAP ARCHING'],
  ['ewKond1', 'KONDUKTOR EARTH WIRE LINE 1'], ['ewKond2', 'KONDUKTOR EARTH WIRE LINE 2'], ['ewAks1', 'AKSESORIS EARTH WIRE LINE 1'],
  ['ewAks2', 'AKSESORIS EARTH WIRE LINE 2'], ['ket', 'KETERANGAN']];
const CUI_MAX_ROWS = 200000;

function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    if (p.action === 'photos') {
      const sh = sheet_(), r = checkRow_(sh, p.row, p.expect);
      const folder = photoFolder_(sh, r, false);
      return json_({ ok: true, folder: folder ? folder.getUrl() : null, photos: folder ? listPhotos_(folder) : [] });
    }
    if (p.action === 'cui') return json_(cuiLatest_());
    ensureIds_(sheet_());
    return json_({ ok: true, source: 'DATABASE ALAT BERAT UIT JBM — ' + SHEET_NAME, rows: readRows_(), moves: readMoves_() });
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

    if (req.action === 'cui_upload') return json_(cuiUpload_(req));

    const sh = sheet_();
    const data = validate_(req.data || {});

    if (req.action === 'update') {
      const r = Number(req.row);
      if (!(r > HEADER_ROWS && r <= sh.getLastRow())) return json_({ ok: false, error: 'Baris tidak valid.' });
      const current = sh.getRange(r, COLS.komponen).getDisplayValue().trim();
      if (req.expect != null && current !== String(req.expect).trim()) {
        return json_({ ok: false, code: 'conflict', error: 'Baris ini sudah berubah di spreadsheet. Muat ulang data lalu coba lagi.' });
      }
      let moved = 0;
      if (req.move && ('upt' in data || 'gi' in data)) moved = moveLocation_(sh, r, data, req.move);
      EDITABLE.forEach(k => { if (k in data && !(moved && (k === 'upt' || k === 'gi'))) write_(sh, r, k, data[k]); });
      return json_({ ok: true, row: readRow_(sh, r), moved: moved });
    }

    if (String(req.action || '').indexOf('photo_') === 0) return json_(photoAction_(sh, req));
    if (req.action === 'move_add' || req.action === 'move_delete') return json_(moveAction_(sh, req));
    if (req.action === 'ba_upload') return json_(baUpload_(sh, req));

    if (req.action === 'add') {
      const r = lastDataRow_(sh) + 1;
      EDITABLE.forEach(k => { if (k in data) write_(sh, r, k, data[k]); });
      ensureIds_(sh);
      return json_({ ok: true, row: readRow_(sh, r) });
    }
    return json_({ ok: false, error: 'Aksi tidak dikenal.' });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

/* ---------- ID komponen & riwayat perpindahan ---------- */
/* Isi kolom ID DASHBOARD (TM-0001, …) untuk baris komponen yang belum punya ID. */
function ensureIds_(sh) {
  const last = lastDataRow_(sh);
  if (last <= HEADER_ROWS) return;
  const head = sh.getRange(1, COLS.id);
  if (!String(head.getDisplayValue()).trim()) head.setValue('ID DASHBOARD').setFontWeight('bold');
  const n = last - HEADER_ROWS;
  const komp = sh.getRange(HEADER_ROWS + 1, COLS.komponen, n, 1).getDisplayValues();
  const rng = sh.getRange(HEADER_ROWS + 1, COLS.id, n, 1), ids = rng.getDisplayValues();
  let max = 0, missing = false;
  ids.forEach(r => { const m = String(r[0]).match(/^TM-(\d+)$/); if (m) max = Math.max(max, Number(m[1])); });
  const out = ids.map((r, i) => {
    if (String(r[0]).trim() || !String(komp[i][0]).trim()) return [r[0]];
    missing = true; max++; return [ID_PREFIX + ('000' + max).slice(-4)];
  });
  if (missing) rng.setValues(out);
}

function moveSheet_(create) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(MOVE_SHEET);
  if (!sh && create) {
    sh = ss.insertSheet(MOVE_SHEET);
    sh.getRange(1, 1, 1, MOVE_HEAD.length).setValues([MOVE_HEAD]).setFontWeight('bold').setBackground('#0B2545').setFontColor('#FFFFFF');
    sh.setFrozenRows(1);
    sh.getRange('B:B').setNumberFormat('dd-mm-yyyy');
  }
  return sh;
}

function fmtDate_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return String(v || '').trim() || null;
}

function readMoves_() {
  const sh = moveSheet_(false);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, MOVE_HEAD.length).getValues()
    .filter(v => String(v[0]).trim())
    .map(v => ({
      id: String(v[0]), tanggal: fmtDate_(v[1]), kompId: String(v[2]), komponen: String(v[3] || ''), sn: String(v[4] || ''),
      dariUpt: String(v[5] || ''), dariGi: String(v[6] || ''), keUpt: String(v[7] || ''), keGi: String(v[8] || ''),
      alasan: String(v[9] || ''), ba: String(v[10] || ''), dicatat: v[11] instanceof Date ? v[11].toISOString() : String(v[11] || ''),
      sumber: String(v[12] || '')
    }));
}

function cleanMove_(m) {
  m = m || {};
  const s = (v, n) => String(v == null ? '' : v).trim().slice(0, n || 300);
  const out = { tanggal: s(m.tanggal, 10), alasan: s(m.alasan, 500), ba: s(m.ba, 500),
    dariUpt: s(m.dariUpt), dariGi: s(m.dariGi), keUpt: s(m.keUpt), keGi: s(m.keGi), set: !!m.set };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(out.tanggal)) throw new Error('Tanggal pindah wajib diisi (format YYYY-MM-DD).');
  ['alasan', 'ba', 'dariUpt', 'dariGi', 'keUpt', 'keGi'].forEach(k => { if (/^[=+\-@]/.test(out[k])) out[k] = "'" + out[k]; });
  return out;
}

function appendMove_(rec, m, sumber) {
  const sh = moveSheet_(true);
  const id = 'MV-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss') + '-' + Math.floor(Math.random() * 1000);
  const p = m.tanggal.split('-').map(Number);
  sh.appendRow([id, new Date(p[0], p[1] - 1, p[2]), rec.id || '', rec.komponen || '', rec.sn || '',
    m.dariUpt, m.dariGi, m.keUpt, m.keGi, m.alasan, m.ba, new Date(), sumber]);
  return id;
}

const norm_ = v => String(v || '').toUpperCase().replace(/\s+/g, '');

/* Ubah lokasi (UPT/GI) baris r — dan seluruh set bila move.set — lalu catat riwayatnya. Mengembalikan jumlah komponen yang dipindah. */
function moveLocation_(sh, r, data, move) {
  const m = cleanMove_(move);
  ensureIds_(sh);
  const recs = readRows_(), me = recs.filter(x => x._row === r)[0];
  if (!me) throw new Error('Baris tidak ditemukan.');
  const keUpt = 'upt' in data ? data.upt : me.upt, keGi = 'gi' in data ? data.gi : me.gi;
  if (norm_(keUpt) === norm_(me.upt) && norm_(keGi) === norm_(me.gi)) return 0;
  const targets = m.set && me.namaAset
    ? recs.filter(x => x.namaAset === me.namaAset && norm_(x.upt) === norm_(me.upt) && norm_(x.gi) === norm_(me.gi))
    : [me];
  targets.forEach(t => {
    appendMove_(t, { tanggal: m.tanggal, alasan: m.alasan, ba: m.ba, dariUpt: t.upt || '', dariGi: t.gi || '', keUpt: keUpt, keGi: keGi },
      targets.length > 1 ? 'Otomatis (satu set)' : 'Otomatis');
    if ('upt' in data) write_(sh, t._row, 'upt', data.upt);
    if ('gi' in data) write_(sh, t._row, 'gi', data.gi);
  });
  return targets.length;
}

function moveAction_(sh, req) {
  const r = checkRow_(sh, req.row, req.expect);
  ensureIds_(sh);
  const me = readRow_(sh, r);
  if (req.action === 'move_add') {
    const m = cleanMove_(req.move);
    if (!m.keGi && !m.keUpt) throw new Error('Isi lokasi tujuan (UPT / gardu induk).');
    appendMove_(me, m, 'Manual');
    return { ok: true, moves: readMoves_() };
  }
  const ms = moveSheet_(false);
  if (!ms || ms.getLastRow() < 2) throw new Error('Riwayat tidak ditemukan.');
  const vals = ms.getRange(2, 1, ms.getLastRow() - 1, 3).getDisplayValues();
  for (let i = 0; i < vals.length; i++) {
    if (vals[i][0] === String(req.moveId)) {
      if (vals[i][2] !== me.id) throw new Error('Riwayat ini bukan milik komponen tersebut.');
      ms.deleteRow(i + 2);
      return { ok: true, moves: readMoves_() };
    }
  }
  throw new Error('Riwayat tidak ditemukan.');
}

/* ---------- dokumen BA mobilisasi (Google Drive) ---------- */
function baUpload_(sh, req) {
  checkRow_(sh, req.row, req.expect);
  const mime = String(req.mime || '');
  if (!BA_MIME[mime]) throw new Error('Format dokumen BA harus PDF, JPG, PNG, DOC, atau DOCX.');
  const bytes = Utilities.base64Decode(String(req.data || ''));
  if (!bytes.length) throw new Error('File dokumen BA kosong.');
  if (bytes.length > BA_MAX_BYTES) throw new Error('Ukuran dokumen BA melebihi 15 MB.');
  const part = v => String(v || '').toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'TIDAK_DIKETAHUI';
  const date = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const base = 'BA_Mobilisasi_' + part(req.dariGi) + '_ke_' + part(req.keGi) + '_' + date, ext = BA_MIME[mime];
  const id = PropertiesService.getScriptProperties().getProperty('BA_FOLDER_ID') || BA_ROOT_ID;
  const folder = DriveApp.getFolderById(id);
  let name = base + ext, n = 2;
  while (folder.getFilesByName(name).hasNext()) name = base + '_' + (n++) + ext; // hindari nama ganda di hari yang sama
  const f = folder.createFile(Utilities.newBlob(bytes, mime, name));
  return { ok: true, url: f.getUrl(), name: name };
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
  const width = Math.max(RIWAYAT_COL - 1 + TAHUN.length * 2, COLS.id);
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

/* ---------- CUI Jarvis: penyimpanan permanen ---------- */
function cuiFolder_() {
  const id = PropertiesService.getScriptProperties().getProperty('CUI_FOLDER_ID') || CUI_ROOT_ID;
  return DriveApp.getFolderById(id);
}

function cuiSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('CUI_SPREADSHEET_ID') || CUI_SPREADSHEET_ID;
  return SpreadsheetApp.openById(id);
}

function cuiLogSheet_(create) {
  const ss = cuiSpreadsheet_();
  let sh = ss.getSheetByName(CUI_LOG_SHEET);
  if (!sh && create) {
    sh = ss.insertSheet(CUI_LOG_SHEET);
    sh.getRange(1, 1, 1, CUI_LOG_HEAD.length).setValues([CUI_LOG_HEAD]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

/* Validasi data ringkas hasil parsing di browser: {source, periode, keys, dict, rows} */
function cuiValidate_(doc) {
  if (!doc || typeof doc !== 'object') throw new Error('Data CUI kosong.');
  const allowed = CUI_FIELDS.map(f => f[0]);
  const keys = Array.isArray(doc.keys) ? doc.keys.map(String) : [];
  if (!keys.length || keys.some(k => allowed.indexOf(k) < 0)) throw new Error('Kolom data CUI tidak dikenali.');
  if (keys.indexOf('lokasi') < 0 || keys.indexOf('tanggal') < 0) throw new Error('Kolom Lokasi/Tanggal Inspeksi tidak ada.');
  const dict = {};
  keys.forEach(k => {
    const d = doc.dict && doc.dict[k];
    if (!Array.isArray(d)) throw new Error('Kamus nilai kolom ' + k + ' tidak valid.');
    dict[k] = d.map(v => String(v == null ? '' : v).slice(0, 500));
  });
  const rows = Array.isArray(doc.rows) ? doc.rows : [];
  if (!rows.length) throw new Error('Tidak ada baris data CUI.');
  if (rows.length > CUI_MAX_ROWS) throw new Error('Jumlah baris CUI terlalu banyak.');
  rows.forEach(r => {
    if (!Array.isArray(r) || r.length !== keys.length) throw new Error('Baris data CUI tidak valid.');
    r.forEach((c, j) => { if (!(c >= 0 && c < dict[keys[j]].length && c % 1 === 0)) throw new Error('Baris data CUI tidak valid.'); });
  });
  const ti = keys.indexOf('tanggal'), ds = rows.map(r => dict.tanggal[r[ti]]).sort();
  return {
    source: String(doc.source || 'export Jarvis').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 150),
    periode: [ds[0], ds[ds.length - 1]], keys: keys, dict: dict, rows: rows
  };
}

function cuiUpload_(req) {
  const doc = cuiValidate_(req.doc);
  const tz = Session.getScriptTimeZone(), now = new Date();
  const tanggal = Utilities.formatDate(now, tz, 'yyyy-MM-dd'), waktu = Utilities.formatDate(now, tz, 'HH:mm:ss');
  const stamp = Utilities.formatDate(now, tz, 'yyyy-MM-dd_HHmmss');
  const folder = cuiFolder_();
  const li = doc.keys.indexOf('lokasi'), towers = {};
  doc.rows.forEach(r => { towers[doc.dict.lokasi[r[li]]] = 1; });
  const nTower = Object.keys(towers).length;

  // 1) file asli (dikirim terkompresi gzip + base64 dari browser; opsional)
  let asli = null;
  if (req.file && req.file.gz) {
    const gz = Utilities.newBlob(Utilities.base64Decode(String(req.file.gz)), 'application/x-gzip', 'f.gz');
    const blob = Utilities.ungzip(gz);
    blob.setName(stamp + '_' + doc.source).setContentType('application/vnd.ms-excel');
    asli = folder.createFile(blob);
  }
  // 2) data ringkas JSON — dibaca dashboard sebagai data terbaru
  const out = { source: doc.source, periode: doc.periode, diunggah: tanggal, diunggahPada: tanggal + ' ' + waktu,
    keys: doc.keys, dict: doc.dict, rows: doc.rows };
  const jf = folder.createFile(Utilities.newBlob(JSON.stringify(out), 'application/json', 'CUI_JARVIS_' + stamp + '.json'));

  // 3) sheet data terbaru (ditimpa setiap unggahan)
  cuiWriteData_(doc, tanggal);

  // 4) log unggahan
  const log = cuiLogSheet_(true), id = 'CUI-' + stamp;
  const lr = log.getRange(log.getLastRow() + 1, 1, 1, CUI_LOG_HEAD.length);
  lr.setNumberFormat('@'); // tanggal & periode disimpan sebagai teks yyyy-MM-dd
  lr.setValues([[id, tanggal, waktu, doc.source, String(doc.rows.length), String(nTower), doc.periode[0], doc.periode[1],
    asli ? asli.getUrl() : '', jf.getUrl(), jf.getId()]]);
  const history = cuiHistory_(log);
  return { ok: true, doc: out, upload: history[0], history: history };
}

function cuiWriteData_(doc, tanggal) {
  const ss = cuiSpreadsheet_();
  const sh = ss.getSheetByName(CUI_DATA_SHEET) || ss.insertSheet(CUI_DATA_SHEET);
  sh.clearContents();
  const fields = CUI_FIELDS.filter(f => doc.keys.indexOf(f[0]) >= 0);
  const idx = fields.map(f => doc.keys.indexOf(f[0]));
  const values = [fields.map(f => f[1])].concat(doc.rows.map(r => idx.map(j => {
    const v = doc.dict[doc.keys[j]][r[j]];
    return /^[=+\-@]/.test(v) ? "'" + v : v; // cegah teks dibaca sebagai rumus
  })));
  if (sh.getMaxRows() < values.length) sh.insertRowsAfter(sh.getMaxRows(), values.length - sh.getMaxRows());
  if (sh.getMaxColumns() < fields.length) sh.insertColumnsAfter(sh.getMaxColumns(), fields.length - sh.getMaxColumns());
  const rng = sh.getRange(1, 1, values.length, fields.length);
  rng.setNumberFormat('@');
  rng.setValues(values);
  sh.getRange(1, 1, 1, fields.length).setFontWeight('bold');
  sh.setFrozenRows(1);
  sh.getRange(1, fields.length + 2).setValue('Data terbaru: ' + doc.source + ' (diunggah ' + tanggal + ')');
}

function cuiHistory_(log) {
  if (!log || log.getLastRow() < 2) return [];
  const n = Math.min(log.getLastRow() - 1, 50);
  const v = log.getRange(log.getLastRow() - n + 1, 1, n, CUI_LOG_HEAD.length).getDisplayValues();
  return v.reverse().map(r => ({ id: r[0], tanggal: r[1], waktu: r[2], file: r[3], klem: Number(r[4]) || 0, tower: Number(r[5]) || 0,
    periode: [r[6], r[7]], asli: r[8] || null, json: r[9] || null, jsonId: r[10] }));
}

/* Data CUI terbaru (unggahan terakhir) + riwayat unggahan */
function cuiLatest_() {
  const history = cuiHistory_(cuiLogSheet_(false));
  for (let i = 0; i < history.length; i++) {
    try {
      const doc = JSON.parse(DriveApp.getFileById(history[i].jsonId).getBlob().getDataAsString());
      return { ok: true, doc: doc, history: history };
    } catch (err) { /* file JSON terhapus — coba unggahan sebelumnya */ }
  }
  return { ok: true, doc: null, history: history };
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
