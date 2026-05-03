'use strict';

// ── MODAL HELPERS ─────────────────────────────────────────────────────────────

function openModal(id) {
  document.getElementById(id).style.display = 'flex';
  document.body.classList.add('modal-open');
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
  document.body.classList.remove('modal-open');
}

function mbClose(e, id) {
  if (e.target === document.getElementById(id)) closeModal(id);
}

// ── ITEM CRUD ─────────────────────────────────────────────────────────────────

function openAdd() {
  const f = id => document.getElementById(id);
  document.getElementById('modalItemTitle').textContent = 'Добавить товар';
  f('fId').value = '';
  f('fName').value = '';
  f('fBrand').value = '';
  f('fOrder').value = '';
  f('fDate').value = new Date().toISOString().slice(0, 10);
  f('fPrice').value = '';
  f('fWarranty').value = '';
  f('fSerial').value = '';
  f('fExecutor').value = '';
  f('fLink').value = '';
  f('fEkLink').value = '';
  f('fNote').value = '';
  f('fStatus').value = 'active';
  fillCatSelect('fCat', '');
  fillShopSelect('fShop', '');
  document.getElementById('specsEditor').innerHTML = '';
  document.getElementById('eventsEditor').innerHTML = '';
  document.getElementById('receiptsEditor').innerHTML = '';
  onCatChange();
  openModal('modalItem');
}

function openEdit(id) {
  const it = data.find(x => x.id === id);
  if (!it) return;
  const f = id => document.getElementById(id);
  document.getElementById('modalItemTitle').textContent = 'Редактировать';
  f('fId').value = it.id;
  f('fName').value = it.name || '';
  f('fBrand').value = it.brand || '';
  f('fOrder').value = it.order || '';
  f('fDate').value = toInputDate(it.date);
  f('fPrice').value = it.price || '';
  f('fWarranty').value = it.warrantyMonths || '';
  f('fSerial').value = it.serialNumber || '';
  f('fExecutor').value = it.executor || '';
  f('fLink').value = it.link || '';
  f('fEkLink').value = it.ekLink || '';
  f('fNote').value = it.note || '';
  f('fStatus').value = it.status || 'active';
  fillCatSelect('fCat', it.category || '');
  fillShopSelect('fShop', it.shop || '');
  onCatChange();
  document.getElementById('specsEditor').innerHTML = '';
  Object.entries(it.specs || {}).forEach(([k, v]) => addSpecRow(k, v));
  document.getElementById('eventsEditor').innerHTML = '';
  (it.events || []).forEach(ev => addEvRow(ev));
  document.getElementById('receiptsEditor').innerHTML = '';
  (it.receipts || []).forEach(r => addReceiptRow(r));
  openModal('modalItem');
}

function fillCatSelect(selId, val) {
  const sel = document.getElementById(selId);
  sel.innerHTML = '';
  cats.forEach(c => {
    const o = document.createElement('option');
    o.value = c.id; o.textContent = c.name;
    sel.appendChild(o);
  });
  if (val) sel.value = val;
}

function fillShopSelect(selId, val) {
  const sel = document.getElementById(selId);
  sel.innerHTML = '<option value="">— не выбран —</option>';
  shops.forEach(s => {
    const o = document.createElement('option');
    o.value = s.id; o.textContent = s.name;
    sel.appendChild(o);
  });
  if (val) {
    const exists = [...sel.options].some(o => o.value === val);
    if (!exists) {
      const o = document.createElement('option');
      o.value = val; o.textContent = shopName(val);
      sel.appendChild(o);
    }
    sel.value = val;
  }
}

function onCatChange() {
  const isSvc = catIsService(document.getElementById('fCat').value);
  document.getElementById('fg-product').style.display  = isSvc ? 'none'  : 'block';
  document.getElementById('fg-executor').style.display = isSvc ? 'block' : 'none';
  document.getElementById('fg-ek').style.display       = isSvc ? 'none'  : 'flex';
  document.getElementById('fg-brand').style.display    = isSvc ? 'none'  : 'flex';
  document.getElementById('fg-specs').style.display    = isSvc ? 'none'  : 'flex';
}

function addSpecRow(key = '', val = '') {
  const ed = document.getElementById('specsEditor');
  const d  = document.createElement('div');
  d.className = 'spec-row-edit';
  d.innerHTML = `<input type="text" placeholder="Параметр" value="${esc(key)}">
    <input type="text" placeholder="Значение" value="${esc(val)}">
    <button class="spec-del" onclick="this.parentElement.remove()" title="Удалить">×</button>`;
  ed.appendChild(d);
}

function addEvRow(ev) {
  ev = ev || {};
  const ed = document.getElementById('eventsEditor');
  const d  = document.createElement('div');
  d.className = 'ev-edit-row';
  d.innerHTML = `<input type="date" class="ev-d" value="${ev.date ? toInputDate(ev.date) : ''}">
    <select class="ev-t">
      <option value="warranty_claim" ${ev.type === 'warranty_claim' ? 'selected' : ''}>Гарантийный</option>
      <option value="repair"         ${ev.type === 'repair'         ? 'selected' : ''}>Ремонт</option>
      <option value="returned"       ${ev.type === 'returned'       ? 'selected' : ''}>Возврат</option>
      <option value="note"           ${ev.type === 'note'           ? 'selected' : ''}>Заметка</option>
    </select>
    <input type="text" class="ev-n ev-note-f" placeholder="Описание" value="${esc(ev.note || '')}">
    <button class="spec-del" onclick="this.parentElement.remove()" title="Удалить">×</button>`;
  ed.appendChild(d);
}

function addReceiptRow(r) {
  r = r || {};
  const ed = document.getElementById('receiptsEditor');
  const d  = document.createElement('div');
  d.className = 'receipt-row-edit';
  const typeOpts = RCPT_TYPES.map(t =>
    `<option value="${t.value}" ${r.type === t.value ? 'selected' : ''}>${t.label}</option>`
  ).join('');
  d.innerHTML = `<select class="rcpt-type">${typeOpts}</select>
    <input type="text" class="rcpt-label" placeholder="Метка (Чек, Гарантія…)" value="${esc(r.label || '')}">
    <input type="text" class="rcpt-value" placeholder="URL или имя файла" value="${esc(r.value || '')}">
    <button class="spec-del" onclick="this.parentElement.remove()" title="Удалить">×</button>`;
  ed.appendChild(d);
}

function saveItem() {
  const name = document.getElementById('fName').value.trim();
  if (!name) { toast('Введите название', 'err'); return; }

  const fId   = document.getElementById('fId').value;
  const cat   = document.getElementById('fCat').value;
  const isSvc = catIsService(cat);

  const specs = {};
  document.querySelectorAll('#specsEditor .spec-row-edit').forEach(r => {
    const [ki, vi] = r.querySelectorAll('input');
    const k = ki.value.trim(), v = vi.value.trim();
    if (k) specs[k] = v;
  });

  const events = [];
  document.querySelectorAll('#eventsEditor .ev-edit-row').forEach(r => {
    events.push({
      date: fromInputDate(r.querySelector('.ev-d').value),
      type: r.querySelector('.ev-t').value,
      note: r.querySelector('.ev-n').value.trim()
    });
  });

  const receipts = [];
  document.querySelectorAll('#receiptsEditor .receipt-row-edit').forEach(r => {
    const val = r.querySelector('.rcpt-value').value.trim();
    if (val) {
      receipts.push({
        type:  r.querySelector('.rcpt-type').value,
        label: r.querySelector('.rcpt-label').value.trim(),
        value: val
      });
    }
  });

  const item = {
    id:             fId || uid(),
    name,
    brand:          isSvc ? '' : document.getElementById('fBrand').value.trim(),
    category:       cat,
    shop:           document.getElementById('fShop').value,
    order:          document.getElementById('fOrder').value.trim(),
    date:           fromInputDate(document.getElementById('fDate').value),
    price:          parseFloat(document.getElementById('fPrice').value) || 0,
    warrantyMonths: isSvc ? 0 : (parseInt(document.getElementById('fWarranty').value) || 0),
    serialNumber:   isSvc ? '' : document.getElementById('fSerial').value.trim(),
    executor:       isSvc ? document.getElementById('fExecutor').value.trim() : '',
    receipts,
    link:           document.getElementById('fLink').value.trim(),
    ekLink:         isSvc ? '' : document.getElementById('fEkLink').value.trim(),
    specs:          isSvc ? {} : specs,
    note:           document.getElementById('fNote').value.trim(),
    status:         document.getElementById('fStatus').value,
    events,
  };

  if (fId) {
    const idx = data.findIndex(x => x.id === fId);
    if (idx >= 0) data[idx] = item; else data.unshift(item);
  } else {
    data.unshift(item);
  }

  closeModal('modalItem');
  openItemIds.clear();
  markDirty('data');
  buildFilters();
  render();
  toast(fId ? 'Товар обновлён' : 'Товар добавлен', 'ok');
}

function deleteItem(id) {
  const it = data.find(x => x.id === id);
  if (!confirm(`Удалить «${it?.name}»?`)) return;
  data = data.filter(x => x.id !== id);
  openItemIds.delete(id);
  markDirty('data');
  buildFilters();
  render();
  toast('Удалено');
}

// ── QUICK EVENT ───────────────────────────────────────────────────────────────

function openAddEvent(itemId) {
  document.getElementById('evItemId').value  = itemId;
  document.getElementById('evDate').value    = new Date().toISOString().slice(0, 10);
  document.getElementById('evType').value    = 'warranty_claim';
  document.getElementById('evNote').value    = '';
  openModal('modalEvent');
}

function saveEvent() {
  const id = document.getElementById('evItemId').value;
  const it = data.find(x => x.id === id);
  if (!it) return;
  if (!it.events) it.events = [];
  it.events.push({
    date: fromInputDate(document.getElementById('evDate').value),
    type: document.getElementById('evType').value,
    note: document.getElementById('evNote').value.trim()
  });
  closeModal('modalEvent');
  markDirty('data');
  if (openItemIds.has(id)) {
    const dtr = document.getElementById('dtr-' + id);
    if (dtr) dtr.querySelector('.item-detail').innerHTML = renderDetail(it);
  }
  toast('Событие добавлено', 'ok');
}

// ── SHOP CRUD ─────────────────────────────────────────────────────────────────

function buildColorPresets(currentColor) {
  const el = document.getElementById('colorPresets');
  el.innerHTML = COLOR_PALETTE.map(c =>
    `<div class="color-preset${c === currentColor ? ' active' : ''}"
      style="background:${c}" onclick="pickColor('${c}')" title="${c}"></div>`
  ).join('');
}

function pickColor(c) {
  document.getElementById('sColor').value = c;
  document.querySelectorAll('.color-preset').forEach(el => el.classList.toggle('active', el.title === c));
}

function openAddShop() {
  document.getElementById('modalShopTitle').textContent = 'Добавить магазин';
  ['sId', 'sName', 'sUrl', 'sLogin', 'sNote'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('sColor').value = '#60a5fa';
  buildColorPresets('#60a5fa');
  openModal('modalShop');
}

function openEditShop(id) {
  const s = shopById(id);
  if (!s) return;
  document.getElementById('modalShopTitle').textContent = 'Редактировать магазин';
  document.getElementById('sId').value    = s.id;
  document.getElementById('sName').value  = s.name || '';
  document.getElementById('sUrl').value   = s.url || '';
  document.getElementById('sLogin').value = s.login || '';
  document.getElementById('sNote').value  = s.note || '';
  const color = s.color || '#60a5fa';
  document.getElementById('sColor').value = color;
  buildColorPresets(color);
  openModal('modalShop');
}

function saveShop() {
  const name = document.getElementById('sName').value.trim();
  if (!name) { toast('Введите название', 'err'); return; }
  const fId  = document.getElementById('sId').value;
  const shop = {
    id:    fId || slugify(name),
    name,
    url:   document.getElementById('sUrl').value.trim(),
    login: document.getElementById('sLogin').value.trim(),
    note:  document.getElementById('sNote').value.trim(),
    color: document.getElementById('sColor').value,
  };
  if (fId) {
    const idx = shops.findIndex(s => s.id === fId);
    if (idx >= 0) shops[idx] = shop; else shops.push(shop);
  } else {
    if (shops.some(s => s.id === shop.id)) shop.id += '_' + Date.now().toString(36);
    shops.push(shop);
  }
  closeModal('modalShop');
  markDirty('shops');
  buildFilters();
  renderSettings();
  toast('Магазин сохранён', 'ok');
}

function deleteShop(id) {
  const s = shopById(id);
  if (!confirm(`Удалить магазин «${s?.name}»?`)) return;
  shops = shops.filter(x => x.id !== id);
  markDirty('shops');
  buildFilters();
  renderSettings();
  toast('Удалено');
}

// ── CATEGORY CRUD ─────────────────────────────────────────────────────────────

function openAddCat() {
  document.getElementById('cName').value = '';
  document.getElementById('cIsService').checked = false;
  openModal('modalCat');
}

function saveCat() {
  const name = document.getElementById('cName').value.trim();
  if (!name) { toast('Введите название', 'err'); return; }
  let id = slugify(name);
  if (cats.some(c => c.id === id)) id += '_' + Date.now().toString(36);
  cats.push({ id, name, isService: document.getElementById('cIsService').checked });
  closeModal('modalCat');
  markDirty('cats');
  buildFilters();
  renderSettings();
  toast('Категория добавлена', 'ok');
}

function deleteCat(id) {
  const c      = cats.find(x => x.id === id);
  const inUse  = data.some(i => i.category === id);
  if (inUse && !confirm(`Категория «${c?.name}» используется. Удалить?`)) return;
  if (!inUse && !confirm(`Удалить категорию «${c?.name}»?`)) return;
  cats = cats.filter(x => x.id !== id);
  markDirty('cats');
  buildFilters();
  renderSettings();
  toast('Удалено');
}
