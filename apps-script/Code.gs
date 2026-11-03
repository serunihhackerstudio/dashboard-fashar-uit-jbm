/**
 * FASHAR UIT JBM — API Database Trafo Mobile
 * ------------------------------------------------------------
 * Pasang skrip ini di spreadsheet DATABASE ALAT BERAT UIT JBM
 * (Extensions → Apps Script), lalu deploy sebagai Web app.
 * Panduan lengkap: README.md bagian "Edit Database Trafo Mobile".
 *
 * GET  <url>              → daftar komponen (JSON)
 * POST <url> (text/plain) → {token, action:"add"|"update", row, expect, data}
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

function doGet() {
  try {
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
