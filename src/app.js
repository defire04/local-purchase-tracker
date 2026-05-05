'use strict';

let _toastTm;
function toast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'show' + (type ? ' ' + type : '');
  clearTimeout(_toastTm);
  _toastTm = setTimeout(() => (el.className = ''), 3200);
}

let _autoSaveTm;
function markDirty(key) {
  Store.markDirty(key);
  document.getElementById('dirtyBadge').style.display = 'flex';
  if (Store.dirHandle) {
    clearTimeout(_autoSaveTm);
    _autoSaveTm = setTimeout(() => saveAll(), 600);
  }
}

function clearDirty() {
  Store.clearDirty();
  document.getElementById('dirtyBadge').style.display = 'none';
}

function showApp() {
  document.getElementById('connectScreen').style.display = 'none';
  document.getElementById('mainApp').classList.add('visible');
  buildFilters();
  render();
}

function switchView(v) {
  Store.setView(v);
  document.getElementById('tabList').classList.toggle('active', v === 'list');
  document.getElementById('tabSettings').classList.toggle('active', v === 'settings');
  document.getElementById('controls').style.display = v === 'list' ? 'flex' : 'none';
  document.getElementById('listView').classList.toggle('active', v === 'list');
  document.getElementById('settingsView').classList.toggle('active', v === 'settings');
  if (v === 'settings') renderSettings();
}

function buildFilters() {
  const catSel = document.getElementById('filterCat');
  const cprev  = catSel.value;
  catSel.innerHTML = `<option value="">${T.allCats}</option>`;
  Store.cats.forEach(c => {
    const o = document.createElement('option');
    o.value = c.id; o.textContent = c.name;
    catSel.appendChild(o);
  });
  catSel.value = cprev;

  const catSelM = document.getElementById('filterCatM');
  if (catSelM) {
    catSelM.innerHTML = `<option value="">${T.allCats}</option>`;
    Store.cats.forEach(c => {
      const o = document.createElement('option');
      o.value = c.id; o.textContent = c.name;
      catSelM.appendChild(o);
    });
    catSelM.value = cprev;
  }

  const brands   = [...new Set(Store.data.map(i => i.brand).filter(Boolean))].sort();
  const brandSel = document.getElementById('filterBrand');
  const bprev    = brandSel.value;
  brandSel.innerHTML = `<option value="">${T.allBrands}</option>`;
  brands.forEach(b => {
    const o = document.createElement('option');
    o.value = b; o.textContent = b;
    brandSel.appendChild(o);
  });
  brandSel.value = bprev;

  const brandSelM = document.getElementById('filterBrandM');
  if (brandSelM) {
    brandSelM.innerHTML = `<option value="">${T.allBrands}</option>`;
    brands.forEach(b => {
      const o = document.createElement('option');
      o.value = b; o.textContent = b;
      brandSelM.appendChild(o);
    });
    brandSelM.value = bprev;
  }

  const shopIds = [...new Set(Store.data.map(i => i.shop).filter(Boolean))].sort();
  const shopSel = document.getElementById('filterShop');
  const sprev   = shopSel.value;
  shopSel.innerHTML = `<option value="">${T.allShops}</option>`;
  shopIds.forEach(id => {
    const o = document.createElement('option');
    o.value = id; o.textContent = shopName(id);
    shopSel.appendChild(o);
  });
  shopSel.value = sprev;

  const shopSelM = document.getElementById('filterShopM');
  if (shopSelM) {
    shopSelM.innerHTML = `<option value="">${T.allShops}</option>`;
    shopIds.forEach(id => {
      const o = document.createElement('option');
      o.value = id; o.textContent = shopName(id);
      shopSelM.appendChild(o);
    });
    shopSelM.value = sprev;
  }

  const wSel  = document.getElementById('filterWarranty');
  const wprev = wSel.value;
  wSel.innerHTML = `
    <option value="">${T.allWarranty}</option>
    <option value="ok">${T.wActive}</option>
    <option value="warn">${T.w6m}</option>
    <option value="expired">${T.wExpired}</option>
    <option value="none">${T.wNone}</option>`;
  wSel.value = wprev;

  const wSelM = document.getElementById('filterWarrantyM');
  if (wSelM) {
    wSelM.innerHTML = `
      <option value="">${T.allWarranty}</option>
      <option value="ok">${T.wActive}</option>
      <option value="warn">${T.w6m}</option>
      <option value="expired">${T.wExpired}</option>
      <option value="none">${T.wNone}</option>`;
    wSelM.value = wprev;
  }

  const sSel   = document.getElementById('filterStatus');
  const sprevS = sSel.value;
  sSel.innerHTML = `
    <option value="">${T.allStatuses}</option>
    <option value="active">${T.sActive}</option>
    <option value="returned">${T.sReturned}</option>
    <option value="written_off">${T.sWrittenOff}</option>`;
  sSel.value = sprevS;

  const sSelM = document.getElementById('filterStatusM');
  if (sSelM) {
    sSelM.innerHTML = `
      <option value="">${T.allStatuses}</option>
      <option value="active">${T.sActive}</option>
      <option value="returned">${T.sReturned}</option>
      <option value="written_off">${T.sWrittenOff}</option>`;
    sSelM.value = sprevS;
  }

  const gSel    = document.getElementById('groupBy');
  const gprev   = gSel.value;
  const groupOpts = `
    <option value="">${T.groupList}</option>
    <option value="order">${T.groupOrder}</option>
    <option value="shop">${T.groupShop}</option>
    <option value="month">${T.groupMonth}</option>
    <option value="category">${T.groupCat}</option>`;
  gSel.innerHTML = groupOpts;
  gSel.value = gprev;

  const gSelM = document.getElementById('groupByM');
  if (gSelM) { gSelM.innerHTML = groupOpts; gSelM.value = gprev; }
}

function hasTextFilters() {
  return ['search', 'filterCat', 'filterBrand', 'filterShop', 'filterWarranty', 'filterStatus']
    .some(id => document.getElementById(id).value.trim());
}

function isGroupedMode() {
  return Store.groupBy !== '' && Store.sortCol === null;
}

function updateResetBtn() {
  document.getElementById('btnReset')
    .classList.toggle('visible', Store.sortCol !== null || hasTextFilters());
}

function resetAll() {
  Store.setSort(null, 'desc');
  ['search', 'groupBy', 'groupByM', 'filterCat', 'filterCatM', 'filterBrand', 'filterBrandM',
   'filterShop', 'filterShopM', 'filterWarranty', 'filterWarrantyM', 'filterStatus', 'filterStatusM',
  ].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  Store.setGroupBy('');
  Store.openItemIds.clear();
  updateResetBtn();
  updateFilterCount();
  render();
}

function getFiltered() {
  const q     = document.getElementById('search').value.toLowerCase().trim();
  const cat   = document.getElementById('filterCat').value;
  const brand = document.getElementById('filterBrand').value;
  const shop  = document.getElementById('filterShop').value;
  const wf    = document.getElementById('filterWarranty').value;
  const sf    = document.getElementById('filterStatus').value;

  let list = Store.data.filter(it => {
    if (q) {
      const hay = (it.name + ' ' + (it.serialNumber || '') + ' ' + (it.brand || '') + ' ' + (it.note || '')).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (cat   && it.category !== cat)   return false;
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

  if (Store.sortCol) {
    list.sort((a, b) => {
      let cmp = 0;
      if (Store.sortCol === 'name')     cmp = (a.name  || '').localeCompare(b.name  || '', 'ru');
      if (Store.sortCol === 'brand')    cmp = (a.brand || '').localeCompare(b.brand || '', 'ru');
      if (Store.sortCol === 'date')     cmp = (parseDate(a.date) || 0) - (parseDate(b.date) || 0);
      if (Store.sortCol === 'price')    cmp = (a.price || 0) - (b.price || 0);
      if (Store.sortCol === 'warranty') {
        const ea = warrantyEnd(a)?.getTime() ?? Infinity;
        const eb = warrantyEnd(b)?.getTime() ?? Infinity;
        cmp = ea - eb;
      }
      return Store.sortDir === 'desc' ? -cmp : cmp;
    });
  } else {
    list.sort((a, b) => (parseDate(b.date) || 0) - (parseDate(a.date) || 0));
  }
  return list;
}

function handleColSort(col) {
  if (Store.sortCol === col) {
    Store.setSort(col, Store.sortDir === 'asc' ? 'desc' : 'asc');
  } else {
    Store.setSort(col, col === 'date' || col === 'price' ? 'desc' : 'asc');
  }
  Store.openItemIds.clear();
  updateResetBtn();
  render();
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  const id     = el.dataset.id;

  switch (action) {
    case 'toggle-item':         toggleItem(id); break;
    case 'toggle-group':        toggleGroup(id); break;
    case 'sort-col':            handleColSort(el.dataset.col); break;
    case 'edit-item':           openEdit(id); break;
    case 'delete-item':         deleteItem(id); break;
    case 'add-event':           openAddEvent(id); break;
    case 'add-shop':            openAddShop(); break;
    case 'edit-shop':           openEditShop(id); break;
    case 'delete-shop':         deleteShop(id); break;
    case 'add-cat':             openAddCat(); break;
    case 'edit-cat':            openEditCat(id); break;
    case 'delete-cat':          deleteCat(id); break;
    case 'pick-color':          pickColor(el.dataset.color); break;
    case 'remove-row':          el.closest('.spec-row-edit, .ev-edit-row, .receipt-row-edit')?.remove(); break;
    case 'close-modal':         closeModal(el.dataset.modal); break;
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const sheet = document.getElementById('filterSheet');
    if (sheet && sheet.style.display !== 'none') { closeFilterSheet(); return; }
    ['modalItem', 'modalShop', 'modalCat', 'modalEvent'].forEach(id => {
      if (document.getElementById(id).style.display !== 'none') closeModal(id);
    });
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveAll();
  }
});

['search', 'filterCat', 'filterBrand', 'filterShop', 'filterWarranty', 'filterStatus'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('input',  () => { Store.openItemIds.clear(); updateResetBtn(); updateFilterCount(); render(); });
  el.addEventListener('change', () => { Store.openItemIds.clear(); updateResetBtn(); updateFilterCount(); render(); });
});

document.getElementById('groupBy').addEventListener('change', e => {
  Store.setGroupBy(e.target.value);
  Store.openItemIds.clear();
  render();
});

if (HAS_FSA) {
  const btn = document.getElementById('btnOpenDir');
  btn.style.display = 'flex';
  btn.addEventListener('click', connectDirectory);
}

document.getElementById('fileInput').addEventListener('change', e => {
  if (e.target.files.length) loadMultipleFiles(e.target.files);
});

document.getElementById('btnEmpty').addEventListener('click', () => {
  Store.setData([]);
  Store.setShops([]);
  Store.setCats([]);
  showApp();
});

document.getElementById('listView').classList.add('active');

new ResizeObserver(entries => {
  const h = entries[0]?.contentRect.height;
  if (h) document.documentElement.style.setProperty('--ctrl-h', h + 'px');
}).observe(document.getElementById('controls'));

updateFilterCount();
