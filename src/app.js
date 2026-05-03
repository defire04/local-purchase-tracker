'use strict';

// ── TOAST ─────────────────────────────────────────────────────────────────────

let _toastTm;
function toast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'show' + (type ? ' ' + type : '');
  clearTimeout(_toastTm);
  _toastTm = setTimeout(() => el.className = '', 3200);
}

// ── DIRTY & AUTO-SAVE ────────────────────────────────────────────────────────

let _autoSaveTm;
function markDirty(key) {
  dirty[key] = true;
  document.getElementById('dirtyBadge').style.display = 'flex';
  if (dirHandle) {
    clearTimeout(_autoSaveTm);
    _autoSaveTm = setTimeout(() => saveAll(), 600);
  }
}

function clearDirty() {
  dirty = { data: false, shops: false, cats: false };
  document.getElementById('dirtyBadge').style.display = 'none';
}

// ── APP BOOT ──────────────────────────────────────────────────────────────────

function showApp() {
  document.getElementById('connectScreen').style.display = 'none';
  document.getElementById('mainApp').classList.add('visible');
  buildFilters();
  render();
}

function switchView(v) {
  currentView = v;
  document.getElementById('tabList').classList.toggle('active',     v === 'list');
  document.getElementById('tabSettings').classList.toggle('active', v === 'settings');
  document.getElementById('controls').style.display = v === 'list' ? 'flex' : 'none';
  document.getElementById('listView').classList.toggle('active',     v === 'list');
  document.getElementById('settingsView').classList.toggle('active', v === 'settings');
  if (v === 'settings') renderSettings();
}

// ── FILTERS ───────────────────────────────────────────────────────────────────

function buildFilters() {
  const catSel = document.getElementById('filterCat');
  const cprev  = catSel.value;
  catSel.innerHTML = `<option value="">${T.allCats}</option>`;
  cats.forEach(c => {
    const o = document.createElement('option');
    o.value = c.id; o.textContent = c.name;
    catSel.appendChild(o);
  });
  catSel.value = cprev;

  const brandSel = document.getElementById('filterBrand');
  const bprev    = brandSel.value;
  const brands   = [...new Set(data.map(i => i.brand).filter(Boolean))].sort();
  brandSel.innerHTML = `<option value="">${T.allBrands}</option>`;
  brands.forEach(b => {
    const o = document.createElement('option');
    o.value = b; o.textContent = b;
    brandSel.appendChild(o);
  });
  brandSel.value = bprev;

  const shopSel = document.getElementById('filterShop');
  const sprev   = shopSel.value;
  shopSel.innerHTML = `<option value="">${T.allShops}</option>`;
  [...new Set(data.map(i => i.shop).filter(Boolean))].sort().forEach(id => {
    const o = document.createElement('option');
    o.value = id; o.textContent = shopName(id);
    shopSel.appendChild(o);
  });
  shopSel.value = sprev;

  // Warranty filter options
  const wSel = document.getElementById('filterWarranty');
  const wprev = wSel.value;
  wSel.innerHTML = `
    <option value="">${T.allWarranty}</option>
    <option value="ok">${T.wActive}</option>
    <option value="warn">${T.w6m}</option>
    <option value="expired">${T.wExpired}</option>
    <option value="none">${T.wNone}</option>`;
  wSel.value = wprev;

  // Status filter options
  const sSel = document.getElementById('filterStatus');
  const sprevS = sSel.value;
  sSel.innerHTML = `
    <option value="">${T.allStatuses}</option>
    <option value="active">${T.sActive}</option>
    <option value="returned">${T.sReturned}</option>
    <option value="written_off">${T.sWrittenOff}</option>`;
  sSel.value = sprevS;

  // GroupBy options
  const gSel = document.getElementById('groupBy');
  const gprev = gSel.value;
  gSel.innerHTML = `
    <option value="">${T.groupList}</option>
    <option value="order">${T.groupOrder}</option>
    <option value="shop">${T.groupShop}</option>
    <option value="month">${T.groupMonth}</option>
    <option value="category">${T.groupCat}</option>`;
  gSel.value = gprev;
}

function hasTextFilters() {
  return ['search', 'filterCat', 'filterBrand', 'filterShop', 'filterWarranty', 'filterStatus']
    .some(id => document.getElementById(id).value.trim());
}

function isGroupedMode() { return groupBy !== '' && sortCol === null; }

function updateResetBtn() {
  document.getElementById('btnReset').classList.toggle('visible', sortCol !== null || hasTextFilters());
}

function resetAll() {
  sortCol = null; sortDir = 'desc';
  ['search', 'filterCat', 'filterBrand', 'filterShop', 'filterWarranty', 'filterStatus']
    .forEach(id => document.getElementById(id).value = '');
  openItemIds.clear();
  updateResetBtn();
  render();
}

// ── FILTERING & SORTING ───────────────────────────────────────────────────────

function getFiltered() {
  const q     = document.getElementById('search').value.toLowerCase().trim();
  const cat   = document.getElementById('filterCat').value;
  const brand = document.getElementById('filterBrand').value;
  const shop  = document.getElementById('filterShop').value;
  const wf    = document.getElementById('filterWarranty').value;
  const sf    = document.getElementById('filterStatus').value;

  let list = data.filter(it => {
    if (q) {
      const hay = (it.name + ' ' + (it.serialNumber || '') + ' ' + (it.brand || '') + ' ' + (it.note || '')).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (cat   && it.category !== cat)  return false;
    if (brand && it.brand    !== brand) return false;
    if (shop  && it.shop     !== shop)  return false;
    if (sf    && it.status   !== sf)    return false;
    if (wf) {
      const ws = warrantyStatus(it);
      if (wf === 'ok'      && ws.s !== 'ok')      return false;
      if (wf === 'warn'    && ws.s !== 'warn')     return false;
      if (wf === 'expired' && ws.s !== 'expired')  return false;
      if (wf === 'none'    && !['none', 'returned', 'written_off'].includes(ws.s)) return false;
    }
    return true;
  });

  if (sortCol) {
    list.sort((a, b) => {
      let cmp = 0;
      if (sortCol === 'name')     cmp = (a.name  || '').localeCompare(b.name  || '', 'ru');
      if (sortCol === 'brand')    cmp = (a.brand  || '').localeCompare(b.brand || '', 'ru');
      if (sortCol === 'date')     cmp = (parseDate(a.date) || 0) - (parseDate(b.date) || 0);
      if (sortCol === 'price')    cmp = (a.price  || 0) - (b.price || 0);
      if (sortCol === 'warranty') {
        const ea = warrantyEnd(a)?.getTime() ?? Infinity;
        const eb = warrantyEnd(b)?.getTime() ?? Infinity;
        cmp = ea - eb;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
  } else {
    list.sort((a, b) => (parseDate(b.date) || 0) - (parseDate(a.date) || 0));
  }
  return list;
}

function handleColSort(col) {
  if (sortCol === col) { sortDir = sortDir === 'asc' ? 'desc' : 'asc'; }
  else { sortCol = col; sortDir = (col === 'date' || col === 'price') ? 'desc' : 'asc'; }
  openItemIds.clear();
  updateResetBtn();
  render();
}

// ── KEYBOARD ──────────────────────────────────────────────────────────────────

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    ['modalItem', 'modalShop', 'modalCat', 'modalEvent'].forEach(id => {
      if (document.getElementById(id).style.display !== 'none') closeModal(id);
    });
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveAll(); }
});

// ── FILTER LISTENERS ──────────────────────────────────────────────────────────

['search', 'filterCat', 'filterBrand', 'filterShop', 'filterWarranty', 'filterStatus'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('input',  () => { openItemIds.clear(); updateResetBtn(); render(); });
  el.addEventListener('change', () => { openItemIds.clear(); updateResetBtn(); render(); });
});

document.getElementById('groupBy').addEventListener('change', e => {
  groupBy = e.target.value;
  openItemIds.clear();
  render();
});

// ── INIT ──────────────────────────────────────────────────────────────────────

if (HAS_FSA) {
  const btn = document.getElementById('btnOpenDir');
  btn.style.display = 'flex';
  btn.addEventListener('click', connectDirectory);
}

document.getElementById('fileInput').addEventListener('change', e => {
  if (e.target.files.length) loadMultipleFiles(e.target.files);
});

document.getElementById('btnEmpty').addEventListener('click', () => {
  data = []; shops = defaultShops(); cats = defaultCats();
  showApp();
});

document.getElementById('listView').classList.add('active');

// Keep --ctrl-h in sync with actual controls height so sticky thead is always correct
new ResizeObserver(entries => {
  const h = entries[0]?.contentRect.height;
  if (h) document.documentElement.style.setProperty('--ctrl-h', h + 'px');
}).observe(document.getElementById('controls'));
