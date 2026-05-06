'use strict';

function openFilterSheet() {
  const gbM = document.getElementById('groupByM');
  if (gbM) {
    gbM.value = document.getElementById('groupBy').value;
  }
  ['Cat', 'Brand', 'Shop', 'Warranty', 'Status'].forEach(k => {
    const d = document.getElementById('filter' + k);
    const m = document.getElementById('filter' + k + 'M');
    if (d && m) {
      m.value = d.value;
    }
  });
  document.getElementById('filterSheet').style.display = 'flex';
}

function closeFilterSheet() {
  document.getElementById('filterSheet').style.display = 'none';
}

function applyFilterSheet() {
  const gbM = document.getElementById('groupByM');
  if (gbM) {
    document.getElementById('groupBy').value = gbM.value;
    AppContext.setGroupBy(gbM.value);
  }
  ['Cat', 'Brand', 'Shop', 'Warranty', 'Status'].forEach(k => {
    const m = document.getElementById('filter' + k + 'M');
    const d = document.getElementById('filter' + k);
    if (m && d) {
      d.value = m.value;
    }
  });
  AppContext.openItemIds.clear();
  updateResetBtn();
  updateFilterCount();
  render();
  closeFilterSheet();
}

function resetFiltersSheet() {
  ['groupBy', 'groupByM'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.value = '';
    }
  });
  AppContext.setGroupBy('');
  ['Cat', 'Brand', 'Shop', 'Warranty', 'Status'].forEach(k => {
    ['filter' + k, 'filter' + k + 'M'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.value = '';
      }
    });
  });
  AppContext.openItemIds.clear();
  updateResetBtn();
  updateFilterCount();
  render();
}

function updateFilterCount() {
  const n = ['filterCat', 'filterBrand', 'filterShop', 'filterWarranty', 'filterStatus']
    .filter(id => document.getElementById(id)?.value).length;
  const badge = document.getElementById('filterCount');
  const btn   = document.getElementById('btnFilterMobile');
  if (badge) {
    badge.textContent = n;
    badge.style.display = n ? 'flex' : 'none';
  }
  if (btn) {
    btn.classList.toggle('has-filters', n > 0);
  }
}
