'use strict';

// Accumulated list of File objects across multiple picker sessions
let _importFiles = [];

function openImportModal() {
  _importFiles = [];
  document.getElementById('importEkLink').value = '';
  document.getElementById('importShopLink').value = '';
  document.getElementById('importDesc').value = '';
  document.getElementById('importFileInput').value = '';
  document.getElementById('importFileNames').innerHTML = '';
  document.getElementById('importJsonInput').value = '';

  const preview = document.getElementById('importPreview');
  preview.innerHTML = '';
  delete preview.dataset.item;
  document.getElementById('importSaveBtn').style.display = 'none';

  openModal('modalImport');
}

function _renderImportFileTags() {
  const namesEl = document.getElementById('importFileNames');
  const saveBtn = document.getElementById('importSaveFilesBtn');
  const hintEl  = document.querySelector('.import-file-hint');
  namesEl.innerHTML = '';
  _importFiles.forEach((f, idx) => {
    const tag = document.createElement('span');
    tag.className = 'import-file-tag';
    tag.innerHTML = `${esc(f.name)} <button class="import-file-remove" onclick="_removeImportFile(${idx})">×</button>`;
    namesEl.appendChild(tag);
  });
  const hasFiles = _importFiles.length > 0;
  saveBtn.style.display = hasFiles ? '' : 'none';
  hintEl.classList.toggle('visible', hasFiles);
}

function _importFileChanged(input) {
  for (const f of input.files) {
    if (!_importFiles.find(existing => existing.name === f.name)) {
      _importFiles.push(f);
    }
  }
  // Reset input so the same file can be picked again after removal
  input.value = '';
  _renderImportFileTags();
}

function _removeImportFile(idx) {
  _importFiles.splice(idx, 1);
  _renderImportFileTags();
}

function _importTextareaChanged() {
  document.getElementById('importSaveBtn').style.display = 'none';
  const preview = document.getElementById('importPreview');
  preview.innerHTML = '';
  delete preview.dataset.item;
}

function copyImportPrompt() {
  const shops = AppContext.shops.map(s => `"${s.id}" (${s.name})`).join(', ') || '—';
  const cats  = AppContext.cats.map(c => `"${c.id}" (${c.name})`).join(', ') || '—';

  const ekLink   = document.getElementById('importEkLink').value.trim();
  const shopLink = document.getElementById('importShopLink').value.trim();
  const desc     = document.getElementById('importDesc').value.trim();
  const fileList = _importFiles.map(f => f.name);

  const ctx = [];
  if (ekLink)        ctx.push(`ek.ua link: ${ekLink}`);
  if (shopLink)      ctx.push(`Shop link: ${shopLink}`);
  if (desc)          ctx.push(`Description / specs:\n${desc}`);
  if (fileList.length) {
    ctx.push(`Receipt file names (add each to receipts[]): ${fileList.join(', ')}`);
  }

  const contextBlock = ctx.length
    ? `\n\nContext (use this to fill in the fields accurately):\n${ctx.join('\n\n')}`
    : '';

  navigator.clipboard
    .writeText(T.importPromptFn(shops, cats) + contextBlock)
    .then(() => toast(T.importPromptCopied));
}

function _validateImportItem(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    return 'name';
  }
  if (!item.name || typeof item.name !== 'string' || !item.name.trim()) {
    return 'name';
  }
  if (item.date && !/^\d{2}\.\d{2}\.\d{4}$/.test(String(item.date))) {
    return 'date (DD.MM.YYYY)';
  }
  if (item.price !== undefined && (typeof item.price !== 'number' || item.price < 0)) {
    return 'price';
  }
  if (item.warrantyMonths !== undefined && (typeof item.warrantyMonths !== 'number' || item.warrantyMonths < 0)) {
    return 'warrantyMonths';
  }
  if (item.status && !['active', 'returned', 'written_off'].includes(item.status)) {
    return 'status';
  }
  if (item.receipts !== undefined && !Array.isArray(item.receipts)) {
    return 'receipts';
  }
  if (item.specs !== undefined && (typeof item.specs !== 'object' || Array.isArray(item.specs))) {
    return 'specs';
  }
  if (item.events !== undefined && !Array.isArray(item.events)) {
    return 'events';
  }
  return null;
}

function _todayDMY() {
  const d  = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${d.getFullYear()}`;
}

function _normalizeImportItem(item) {
  return {
    id: uid(),
    name: String(item.name || '').trim(),
    brand: String(item.brand || '').trim(),
    category: String(item.category || '').trim(),
    shop: String(item.shop || '').trim(),
    order: String(item.order || '').trim(),
    date: String(item.date || '') || _todayDMY(),
    price: typeof item.price === 'number' ? item.price : 0,
    warrantyMonths: typeof item.warrantyMonths === 'number' ? Math.round(item.warrantyMonths) : 0,
    serialNumber: String(item.serialNumber || '').trim(),
    link: String(item.link || '').trim(),
    ekLink: String(item.ekLink || '').trim(),
    note: String(item.note || '').trim(),
    status: ['active', 'returned', 'written_off'].includes(item.status) ? item.status : 'active',
    receipts: Array.isArray(item.receipts) ? item.receipts : [],
    specs: (item.specs && typeof item.specs === 'object' && !Array.isArray(item.specs)) ? item.specs : {},
    events: Array.isArray(item.events) ? item.events : [],
  };
}

function _mergeAttachedFiles(item) {
  for (const f of _importFiles) {
    if (!item.receipts.find(r => r.value === f.name)) {
      const ext  = f.name.split('.').pop().toLowerCase();
      const type = ext === 'pdf' ? 'pdf' : 'photo';
      item.receipts.push({ type, label: '', value: f.name });
    }
  }
}

function previewImport() {
  const raw      = document.getElementById('importJsonInput').value.trim();
  const previewEl = document.getElementById('importPreview');
  const saveBtn  = document.getElementById('importSaveBtn');

  saveBtn.style.display = 'none';
  delete previewEl.dataset.item;

  if (!raw) {
    previewEl.innerHTML = '';
    return;
  }

  // Strip markdown code fence if AI wrapped the JSON in ```json ... ```
  const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');

  let parsed;
  try {
    parsed = JSON.parse(stripped);
  } catch (e) {
    previewEl.innerHTML = `<div class="import-error">${esc(T.importErrJson)}<br><small>${esc(e.message)}</small></div>`;
    return;
  }

  const errField = _validateImportItem(parsed);
  if (errField) {
    previewEl.innerHTML = `<div class="import-error">${esc(T.importErrField(errField))}</div>`;
    return;
  }

  const item = _normalizeImportItem(parsed);
  _mergeAttachedFiles(item);

  const warnings = [];
  if (item.shop && !AppContext.shops.find(s => s.id === item.shop)) {
    warnings.push(T.importWarnShop(item.shop));
  }
  if (item.category && !AppContext.cats.find(c => c.id === item.category)) {
    warnings.push(T.importWarnCat(item.category));
  }

  const shopName   = item.shop ? (AppContext.shops.find(s => s.id === item.shop)?.name || item.shop) : '—';
  const catName    = item.category ? (AppContext.cats.find(c => c.id === item.category)?.name || item.category) : '—';
  const warrantyStr = item.warrantyMonths ? `${item.warrantyMonths} ${T.months}` : T.wBadgeNone;
  const specsCount  = Object.keys(item.specs).length;

  let html = `<div class="import-preview-card">
    <div class="import-preview-name">${esc(item.name)}</div>
    <div class="import-preview-meta">
      ${item.brand ? `<span>${esc(item.brand)}</span> · ` : ''}<span>${esc(catName)}</span> · <span>${esc(shopName)}</span>
    </div>
    <div class="import-preview-row">
      <span>${esc(item.date || '—')}</span>
      <span>${fmtPrice(item.price)}</span>
      <span>${warrantyStr}</span>
    </div>
    ${item.serialNumber ? `<div class="import-preview-serial">${esc(T.specSerial)}: ${esc(item.serialNumber)}</div>` : ''}
    ${specsCount ? `<div class="import-preview-serial">${specsCount} характеристик</div>` : ''}
    ${item.receipts.length ? `<div class="import-preview-serial">📎 ${item.receipts.length} файл(а)</div>` : ''}
    ${item.note ? `<div class="import-preview-note">${esc(item.note)}</div>` : ''}
  </div>`;

  if (warnings.length) {
    html += `<div class="import-warnings">${warnings.map(w => `<div class="import-warn">⚠ ${esc(w)}</div>`).join('')}</div>`;
  }

  previewEl.innerHTML = html;
  previewEl.dataset.item = JSON.stringify(item);
  saveBtn.style.display = '';
}

async function _copyReceiptFile(file) {
  try {
    const receiptsDir = await AppContext.dirHandle.getDirectoryHandle('receipts', { create: true });
    const fh          = await receiptsDir.getFileHandle(file.name, { create: true });
    const writable    = await fh.createWritable();
    await writable.write(file);
    await writable.close();
    return true;
  } catch {
    return false;
  }
}

function _downloadFile(file) {
  const url = URL.createObjectURL(file);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

async function _writeFilesToDir(dir, files) {
  let copied = 0;
  for (const f of files) {
    try {
      const fh       = await dir.getFileHandle(f.name, { create: true });
      const writable = await fh.createWritable();
      await writable.write(f);
      await writable.close();
      copied++;
    } catch {
      // skip individual failures
    }
  }
  return copied;
}

async function _copyAttachedFiles(files) {
  if (!files.length) {
    return;
  }

  // Data folder is open — copy to its receipts/ subfolder automatically
  if (AppContext.dirHandle && await checkWritePermission()) {
    let copied = 0;
    for (const f of files) {
      if (await _copyReceiptFile(f)) {
        copied++;
      }
    }
    if (copied > 0) {
      toast(T.importReceiptsCopied(copied));
      return;
    }
  }

  // No dirHandle — let user pick the target folder manually
  if (HAS_FSA) {
    toast(T.importPickReceiptsDir);
    await new Promise(r => setTimeout(r, 900));
    try {
      const dir    = await showDirectoryPicker({ mode: 'readwrite' });
      const copied = await _writeFilesToDir(dir, files);
      toast(T.importReceiptsCopied(copied));
      return;
    } catch (e) {
      if (e.name === 'AbortError') {
        return;
      }
    }
  }

  // Final fallback: browser download
  for (const f of files) {
    _downloadFile(f);
  }
  toast(T.importReceiptsDownloaded);
}

async function saveReceiptFiles() {
  if (!_importFiles.length) {
    return;
  }
  await _copyAttachedFiles([..._importFiles]);
}

async function saveImport() {
  const previewEl = document.getElementById('importPreview');
  if (!previewEl.dataset.item) {
    return;
  }

  const item        = JSON.parse(previewEl.dataset.item);
  const filesToCopy = [..._importFiles];
  let shopsDirty    = false;
  let catsDirty     = false;

  if (item.shop && !AppContext.shops.find(s => s.id === item.shop)) {
    ShopService.save({ id: item.shop, name: item.shop, url: '', login: '', note: '', color: '#a3a3a3' });
    shopsDirty = true;
  }
  if (item.category && !AppContext.cats.find(c => c.id === item.category)) {
    CategoryService.save({ id: item.category, name: item.category, isService: false });
    catsDirty = true;
  }

  ItemService.save(item);
  markDirty('data');
  if (shopsDirty) {
    markDirty('shops');
  }
  if (catsDirty) {
    markDirty('cats');
  }

  buildFilters();
  render();
  closeModal('modalImport');
  toast(T.toastImported);
}
