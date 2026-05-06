'use strict';

function openExportModal() {
  const today = new Date().toISOString().slice(0, 10);
  const jan1  = new Date().getFullYear() + '-01-01';
  document.getElementById('expFrom').value  = jan1;
  document.getElementById('expTo').value    = today;
  document.getElementById('expScope').value = 'all';
  openModal('modalExport');
}

function doExport() {
  if (typeof XLSX === 'undefined') {
    toast(T.toastXlsxMissing, 'err');
    return;
  }

  const from  = document.getElementById('expFrom').value;
  const to    = document.getElementById('expTo').value;
  const scope = document.getElementById('expScope').value;

  const fromDate = from ? new Date(from + 'T00:00:00') : null;
  const toDate   = to   ? new Date(to   + 'T23:59:59') : null;

  const inRange = it => {
    const d = parseDate(it.date);
    if (!d) return !(fromDate || toDate);
    if (fromDate && d < fromDate) return false;
    if (toDate   && d > toDate)   return false;
    return true;
  };

  let items;
  if (scope === 'filtered') {
    items = getFiltered().filter(inRange);
  } else if (scope === 'active') {
    items = AppContext.data.filter(it => it.status === 'active' && inRange(it));
  } else {
    items = AppContext.data.filter(inRange);
  }

  items.sort((a, b) => (parseDate(b.date) || 0) - (parseDate(a.date) || 0));

  if (!items.length) { toast(T.toastNoData, 'err'); return; }

  closeModal('modalExport');
  generateExcel(items, from, to);
}

function generateExcel(items, from, to) {
  // ── Palette ────────────────────────────────────────────────────────
  const HDR_BG    = '0D1E33';
  const HDR_FG    = 'FFFFFF';
  const ALT_BG    = 'EEF5FF';
  const BORDER_C  = 'C8D9EE';
  const LINK_C    = '1A6FBF';
  const STATUS_ACTIVE_BG    = 'D1F5E0'; const STATUS_ACTIVE_FG    = '0D5C2E';
  const STATUS_RETURNED_BG  = 'E8DFFE'; const STATUS_RETURNED_FG  = '4A1D8C';
  const STATUS_WRITTENOFF_BG= 'EEEEEE'; const STATUS_WRITTENOFF_FG= '555555';

  const border = s => ({
    top:    { style: s, color: { rgb: BORDER_C } },
    bottom: { style: s, color: { rgb: BORDER_C } },
    left:   { style: s, color: { rgb: BORDER_C } },
    right:  { style: s, color: { rgb: BORDER_C } },
  });

  // ── Column definitions ─────────────────────────────────────────────
  const cols = [
    { key: 'name',        header: T.exName,      w: 36 },
    { key: 'brand',       header: T.exBrand,     w: 14 },
    { key: 'category',    header: T.exCat,       w: 16 },
    { key: 'shop',        header: T.exShop,      w: 16 },
    { key: 'order',       header: T.exOrder,     w: 14 },
    { key: 'date',        header: T.exDate,      w: 12 },
    { key: 'price',       header: T.exPrice,     w: 12 },
    { key: 'warranty',    header: T.exWarranty,  w: 10 },
    { key: 'warrantyEnd', header: T.exWarEnd,    w: 13 },
    { key: 'serial',      header: T.exSerial,    w: 18 },
    { key: 'status',      header: T.exStatus,    w: 13 },
    { key: 'executor',    header: T.exExecutor,  w: 18 },
    { key: 'note',        header: T.exNote,      w: 28 },
    { key: 'receipts',    header: T.exReceipts,  w: 35 },
    { key: 'link',        header: T.exLink,      w: 35 },
    { key: 'ekLink',      header: T.exEk,        w: 30 },
  ];

  const STATUS_LABELS = { active: T.exSActive, returned: T.exSReturned, written_off: T.exSWrittenOff };

  // ── Header row style ───────────────────────────────────────────────
  const hdrS = {
    font:      { bold: true, sz: 11, color: { rgb: HDR_FG }, name: 'Calibri' },
    fill:      { patternType: 'solid', fgColor: { rgb: HDR_BG } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: false },
    border:    border('medium'),
  };

  const aoa = [cols.map(c => ({ v: c.header, t: 's', s: hdrS }))];

  // ── Data rows ──────────────────────────────────────────────────────
  items.forEach((it, idx) => {
    const alt   = idx % 2 === 1;
    const rowBg = alt ? ALT_BG : 'FFFFFF';

    const base = {
      fill:      { patternType: 'solid', fgColor: { rgb: rowBg } },
      alignment: { vertical: 'top', wrapText: true },
      border:    border('thin'),
      font:      { sz: 10, name: 'Calibri' },
    };
    const ctr  = { ...base, alignment: { ...base.alignment, horizontal: 'center' } };
    const rght = { ...base, alignment: { ...base.alignment, horizontal: 'right'  } };
    const bold = { ...base, font: { ...base.font, bold: true } };
    const link = { ...base, font: { ...base.font, color: { rgb: LINK_C }, underline: true } };

    const sCode = it.status || 'active';
    const sBgs  = { active: STATUS_ACTIVE_BG, returned: STATUS_RETURNED_BG, written_off: STATUS_WRITTENOFF_BG };
    const sFgs  = { active: STATUS_ACTIVE_FG, returned: STATUS_RETURNED_FG, written_off: STATUS_WRITTENOFF_FG };
    const statusS = {
      ...ctr,
      fill: { patternType: 'solid', fgColor: { rgb: sBgs[sCode] || rowBg } },
      font: { ...base.font, bold: true, color: { rgb: sFgs[sCode] || '000000' } },
    };

    const dateObj = parseDate(it.date);
    const wEnd    = ItemService.warrantyEnd(it);
    const dateS   = { ...ctr, numFmt: 'DD.MM.YYYY' };

    const rcptTxt = (it.receipts || [])
      .filter(r => r.value)
      .map(r => {
        const href = /^https?:\/\//.test(r.value) ? r.value : `./receipts/${r.value}`;
        return r.label ? `${r.label}: ${href}` : href;
      })
      .join('\n');

    const catObj  = AppContext.cats.find(c => c.id === it.category);
    const shopObj = ShopService.findById(it.shop);

    const s  = (v, st = base) => ({ v: v || '', t: 's', s: st });
    const n  = (v, st = rght, fmt = '#,##0') => v != null && v !== ''
      ? { v: Number(v), t: 'n', z: fmt, s: st }
      : { v: '', t: 's', s: base };

    aoa.push([
      s(it.name, bold),
      s(it.brand),
      s(catObj?.name || it.category),
      s(shopObj?.name || it.shop),
      s(it.order),
      dateObj ? { v: dateObj, t: 'd', z: 'DD.MM.YYYY', s: dateS } : { v: '', t: 's', s: base },
      n(it.price, rght, '#,##0'),
      it.warrantyMonths ? n(it.warrantyMonths, ctr, '0') : { v: '', t: 's', s: base },
      wEnd ? { v: wEnd, t: 'd', z: 'DD.MM.YYYY', s: dateS } : { v: '', t: 's', s: base },
      s(it.serialNumber),
      { v: STATUS_LABELS[sCode] || sCode, t: 's', s: statusS },
      s(it.executor),
      s(it.note),
      s(rcptTxt, { ...base, alignment: { ...base.alignment, wrapText: true } }),
      s(it.link,   it.link   ? link : base),
      s(it.ekLink, it.ekLink ? link : base),
    ]);
  });

  // ── Build worksheet ────────────────────────────────────────────────
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  ws['!cols'] = cols.map(c => ({ wch: c.w }));
  ws['!rows'] = [{ hpt: 26 }];

  const lastCol = colLetter(cols.length - 1);
  ws['!autofilter'] = { ref: `A1:${lastCol}${items.length + 1}` };
  ws['!freeze'] = 'A2';

  const linkColIdx   = 14;
  const ekLinkColIdx = 15;
  items.forEach((it, i) => {
    const r = i + 1;
    if (it.link) {
      const ref = XLSX.utils.encode_cell({ r, c: linkColIdx });
      if (ws[ref]) ws[ref].l = { Target: it.link };
    }
    if (it.ekLink) {
      const ref = XLSX.utils.encode_cell({ r, c: ekLinkColIdx });
      if (ws[ref]) ws[ref].l = { Target: it.ekLink };
    }
  });

  // ── Workbook ───────────────────────────────────────────────────────
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, T.navPurchases);

  const fFrom = from ? from.replaceAll('-', '.') : '';
  const fTo   = to   ? to.replaceAll('-', '.')   : '';
  let suffix;
  if (fFrom && fTo) {
    suffix = `_${fFrom}–${fTo}`;
  } else if (fFrom) {
    suffix = `_${fFrom}`;
  } else if (fTo) {
    suffix = `_${fTo}`;
  } else {
    suffix = '';
  }
  XLSX.writeFile(wb, `purchases${suffix}.xlsx`);

  toast(T.toastExported(items.length), 'ok');
}

function colLetter(idx) {
  let s = '';
  idx++;
  while (idx > 0) {
    idx--;
    s = String.fromCodePoint(65 + (idx % 26)) + s;
    idx = Math.floor(idx / 26);
  }
  return s;
}
