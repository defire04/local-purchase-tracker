'use strict';

function buildFilters() {
  const catSel = document.getElementById('filterCat');
  const cprev = catSel.value;
  catSel.innerHTML = `<option value="">${T.allCats}</option>`;
  AppContext.cats.forEach(c => {
    const o = document.createElement('option');
    o.value = c.id;
    o.textContent = c.name;
    catSel.appendChild(o);
  });
  catSel.value = cprev;

  const catSelM = document.getElementById('filterCatM');
  if (catSelM) {
    catSelM.innerHTML = `<option value="">${T.allCats}</option>`;
    AppContext.cats.forEach(c => {
      const o = document.createElement('option');
      o.value = c.id;
      o.textContent = c.name;
      catSelM.appendChild(o);
    });
    catSelM.value = cprev;
  }

  const brands = [...new Set(AppContext.data.map(i => i.brand).filter(Boolean))].sort();
  const brandSel = document.getElementById('filterBrand');
  const bprev = brandSel.value;
  brandSel.innerHTML = `<option value="">${T.allBrands}</option>`;
  brands.forEach(b => {
    const o = document.createElement('option');
    o.value = b;
    o.textContent = b;
    brandSel.appendChild(o);
  });
  brandSel.value = bprev;

  const brandSelM = document.getElementById('filterBrandM');
  if (brandSelM) {
    brandSelM.innerHTML = `<option value="">${T.allBrands}</option>`;
    brands.forEach(b => {
      const o = document.createElement('option');
      o.value = b;
      o.textContent = b;
      brandSelM.appendChild(o);
    });
    brandSelM.value = bprev;
  }

  const shopIds = [...new Set(AppContext.data.map(i => i.shop).filter(Boolean))].sort();
  const shopSel = document.getElementById('filterShop');
  const sprev = shopSel.value;
  shopSel.innerHTML = `<option value="">${T.allShops}</option>`;
  shopIds.forEach(id => {
    const o = document.createElement('option');
    o.value = id;
    o.textContent = ShopService.getName(id);
    shopSel.appendChild(o);
  });
  shopSel.value = sprev;

  const shopSelM = document.getElementById('filterShopM');
  if (shopSelM) {
    shopSelM.innerHTML = `<option value="">${T.allShops}</option>`;
    shopIds.forEach(id => {
      const o = document.createElement('option');
      o.value = id;
      o.textContent = ShopService.getName(id);
      shopSelM.appendChild(o);
    });
    shopSelM.value = sprev;
  }

  const warrantyOpts = `
    <option value="">${T.allWarranty}</option>
    <option value="ok">${T.wActive}</option>
    <option value="warn">${T.w6m}</option>
    <option value="expired">${T.wExpired}</option>
    <option value="none">${T.wNone}</option>`;

  const wSel = document.getElementById('filterWarranty');
  const wprev = wSel.value;
  wSel.innerHTML = warrantyOpts;
  wSel.value = wprev;

  const wSelM = document.getElementById('filterWarrantyM');
  if (wSelM) {
    wSelM.innerHTML = warrantyOpts;
    wSelM.value = wprev;
  }

  const statusOpts = `
    <option value="">${T.allStatuses}</option>
    <option value="active">${T.sActive}</option>
    <option value="returned">${T.sReturned}</option>
    <option value="written_off">${T.sWrittenOff}</option>`;

  const sSel = document.getElementById('filterStatus');
  const sprevS = sSel.value;
  sSel.innerHTML = statusOpts;
  sSel.value = sprevS;

  const sSelM = document.getElementById('filterStatusM');
  if (sSelM) {
    sSelM.innerHTML = statusOpts;
    sSelM.value = sprevS;
  }

  const groupOpts = `
    <option value="">${T.groupList}</option>
    <option value="order">${T.groupOrder}</option>
    <option value="shop">${T.groupShop}</option>
    <option value="month">${T.groupMonth}</option>
    <option value="category">${T.groupCat}</option>`;

  const gSel = document.getElementById('groupBy');
  const gprev = gSel.value;
  gSel.innerHTML = groupOpts;
  gSel.value = gprev;

  const gSelM = document.getElementById('groupByM');
  if (gSelM) {
    gSelM.innerHTML = groupOpts;
    gSelM.value = gprev;
  }
}

function hasTextFilters() {
  return ['search', 'filterCat', 'filterBrand', 'filterShop', 'filterWarranty', 'filterStatus']
    .some(id => document.getElementById(id).value.trim());
}

function isGroupedMode() {
  return AppContext.groupBy !== '' && AppContext.sortCol === null;
}

function updateResetBtn() {
  document.getElementById('btnReset')
    .classList.toggle('visible', AppContext.sortCol !== null || hasTextFilters());
}

function resetAll() {
  AppContext.setSort(null, 'desc');
  ['search', 'groupBy', 'groupByM', 'filterCat', 'filterCatM', 'filterBrand', 'filterBrandM',
    'filterShop', 'filterShopM', 'filterWarranty', 'filterWarrantyM', 'filterStatus', 'filterStatusM',
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.value = '';
    }
  });
  AppContext.setGroupBy('');
  AppContext.openItemIds.clear();
  updateResetBtn();
  updateFilterCount();
  render();
}

function getFiltered() {
  const q = document.getElementById('search').value.toLowerCase().trim();
  const cat = document.getElementById('filterCat').value;
  const brand = document.getElementById('filterBrand').value;
  const shop = document.getElementById('filterShop').value;
  const wf = document.getElementById('filterWarranty').value;
  const sf = document.getElementById('filterStatus').value;

  let list = AppContext.data.filter(it => {
    if (q) {
      const hay = (it.name + ' ' + (it.order || '') + ' ' + (it.serialNumber || '') + ' ' + (it.brand || '') + ' ' + (it.note || '')).toLowerCase();
      if (!hay.includes(q)) {
        return false;
      }
    }
    if (cat && it.category !== cat) {
      return false;
    }
    if (brand && it.brand !== brand) {
      return false;
    }
    if (shop && it.shop !== shop) {
      return false;
    }
    if (sf && it.status !== sf) {
      return false;
    }
    if (wf) {
      const ws = ItemService.warrantyStatus(it);
      if (wf === 'ok' && ws.s !== 'ok' && ws.s !== 'warn') {
        return false;
      }
      if (wf === 'warn' && ws.s !== 'warn') {
        return false;
      }
      if (wf === 'expired' && ws.s !== 'expired') {
        return false;
      }
      if (wf === 'none' && !['none', 'returned', 'written_off'].includes(ws.s)) {
        return false;
      }
    }
    return true;
  });

  if (AppContext.sortCol) {
    list.sort((a, b) => {
      let cmp = 0;
      if (AppContext.sortCol === 'name') {
        cmp = (a.name || '').localeCompare(b.name || '', 'ru');
      }
      if (AppContext.sortCol === 'brand') {
        cmp = (a.brand || '').localeCompare(b.brand || '', 'ru');
      }
      if (AppContext.sortCol === 'date') {
        cmp = (parseDate(a.date) || 0) - (parseDate(b.date) || 0);
      }
      if (AppContext.sortCol === 'price') {
        cmp = (a.price || 0) - (b.price || 0);
      }
      if (AppContext.sortCol === 'warranty') {
        const ea = ItemService.warrantyEnd(a)?.getTime() ?? Infinity;
        const eb = ItemService.warrantyEnd(b)?.getTime() ?? Infinity;
        cmp = ea - eb;
      }
      return AppContext.sortDir === 'desc' ? -cmp : cmp;
    });
  } else {
    list.sort((a, b) => (parseDate(b.date) || 0) - (parseDate(a.date) || 0));
  }
  return list;
}

function handleColSort(col) {
  if (AppContext.sortCol === col) {
    AppContext.setSort(col, AppContext.sortDir === 'asc' ? 'desc' : 'asc');
  } else {
    AppContext.setSort(col, col === 'date' || col === 'price' ? 'desc' : 'asc');
  }
  AppContext.openItemIds.clear();
  updateResetBtn();
  render();
}
